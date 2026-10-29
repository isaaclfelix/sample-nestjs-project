import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Requires an authenticated session (`session.userId` set).
 *
 * Use on routes that guests must not call (e.g. PATCH/DELETE own user).
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  /**
   * Allows the request when the session is bound to a user.
   *
   * @param {ExecutionContext} context - Nest HTTP execution context.
   * @returns {boolean} True when authenticated.
   * @throws {UnauthorizedException} When there is no user on the session.
   */
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.session?.userId) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
