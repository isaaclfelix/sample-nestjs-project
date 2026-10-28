import type { Request, Response } from 'express';
import { SESSION_COOKIE_NAME } from './session.constants.js';

/**
 * Parses a Cookie header into a name → value map.
 *
 * @param {string | undefined} header - Raw Cookie header.
 * @returns {Record<string, string>} Cookie pairs (empty when header is missing).
 */
export function parseCookieHeader(
  header: string | undefined,
): Record<string, string> {
  if (!header) {
    return {};
  }

  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const name = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    out[name] = decodeURIComponent(value);
  }
  return out;
}

/**
 * Reads the session id from the request Cookie header.
 *
 * @param {Request} req - Incoming Express request.
 * @returns {string | undefined} Session id when present.
 */
export function readSessionId(req: Request): string | undefined {
  const cookies = parseCookieHeader(req.headers.cookie);
  const value = cookies[SESSION_COOKIE_NAME];
  return value || undefined;
}

/**
 * Sets the HttpOnly session cookie on the response.
 *
 * @param {Response} res - Express response.
 * @param {string} sessionId - Opaque session id.
 * @param {Date} expiresAt - Cookie expiry (matches session row).
 * @returns {void}
 */
export function setSessionCookie(
  res: Response,
  sessionId: string,
  expiresAt: Date,
): void {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${expiresAt.toUTCString()}`,
  ];
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }
  res.append('Set-Cookie', parts.join('; '));
}

/**
 * Clears the session cookie (logout / destroy).
 *
 * @param {Response} res - Express response.
 * @returns {void}
 */
export function clearSessionCookie(res: Response): void {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ];
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }
  res.append('Set-Cookie', parts.join('; '));
}
