import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { CSRF_HEADER_NAME } from './session.constants.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Requires a matching CSRF header on mutating `/api` requests.
 *
 * Safe methods and non-API routes pass through. Tokens are compared with
 * `timingSafeEqual`. The token is issued only via HTML meta (or the session
 * already on the request), not a dedicated JSON mint endpoint.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  /**
   * Allows the request when CSRF is not required or the header matches.
   *
   * @param {ExecutionContext} context - Nest HTTP execution context.
   * @returns {boolean} True when the request may proceed.
   * @throws {ForbiddenException} When the CSRF token is missing or invalid.
   */
  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method.toUpperCase();
    if (SAFE_METHODS.has(method)) {
      return true;
    }

    // Only enforce CSRF on the JSON API surface.
    if (!req.path.startsWith('/api')) {
      return true;
    }

    const session = req.session;
    const header = req.headers[CSRF_HEADER_NAME];
    const provided = Array.isArray(header) ? header[0] : header;

    if (
      !session?.csrfToken ||
      !provided ||
      !csrfTokensEqual(session.csrfToken, provided)
    ) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}

/**
 * Timing-safe equality for CSRF token strings.
 *
 * @param {string} expected - Token from the session.
 * @param {string} provided - Token from the request header.
 * @returns {boolean} True when both strings are equal.
 */
function csrfTokensEqual(expected: string, provided: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
