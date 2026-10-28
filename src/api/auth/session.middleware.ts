import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { shouldAttachSession } from './session-path.js';
import { readSessionId, setSessionCookie } from './session-cookie.js';
import { SessionService } from './session.service.js';

/**
 * Loads or creates a guest session and attaches it to the request.
 *
 * Runs for HTML pages and `/api` so SSR can embed a CSRF meta token and
 * mutating API calls share the same cookie-backed session.
 */
@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(private readonly sessions: SessionService) {}

  /**
   * Ensures `req.session` when the path needs a session; otherwise calls through.
   *
   * @param {Request} req - Incoming request.
   * @param {Response} res - Outgoing response (may receive Set-Cookie).
   * @param {NextFunction} next - Express next.
   * @returns {Promise<void>}
   */
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!shouldAttachSession(req.path)) {
      next();
      return;
    }

    try {
      const existingId = readSessionId(req);
      let session = existingId
        ? await this.sessions.findById(existingId)
        : null;

      // Mint a guest session when the cookie is missing or expired.
      if (!session) {
        session = await this.sessions.createGuest();
        setSessionCookie(res, session.id, session.expiresAt);
      }

      req.session = session;
      next();
    } catch (error) {
      next(error);
    }
  }
}
