import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../persistence/prisma.service.js';
import { SESSION_TTL_MS } from './session.constants.js';
import type { AppSession } from './session.js';

/**
 * Persists and rotates opaque server-side sessions (guest or authenticated).
 */
@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a guest session with a fresh CSRF token.
   *
   * @returns {Promise<AppSession>} The new session.
   */
  async createGuest(): Promise<AppSession> {
    return this.insertSession(null);
  }

  /**
   * Loads a non-expired session by id.
   *
   * @param {string} id - Opaque session id from the cookie.
   * @returns {Promise<AppSession | null>} The session, or null when missing/expired.
   */
  async findById(id: string): Promise<AppSession | null> {
    const row = await this.prisma.client.session.findUnique({ where: { id } });
    if (!row) {
      return null;
    }
    if (row.expiresAt.getTime() <= Date.now()) {
      // Drop expired rows so cookies do not keep resurrecting dead sessions.
      await this.prisma.client.session.delete({ where: { id } }).catch(() => {
        /* already gone */
      });
      return null;
    }
    return toAppSession(row);
  }

  /**
   * Replaces a session id (fixation defense) and optionally attaches a user.
   *
   * Deletes the previous row when present, then inserts a new id and CSRF token.
   *
   * @param {string | null} previousId - Cookie session to destroy, if any.
   * @param {string | null} userId - Authenticated user id, or null for guest.
   * @returns {Promise<AppSession>} The regenerated session.
   */
  async regenerate(
    previousId: string | null,
    userId: string | null,
  ): Promise<AppSession> {
    if (previousId) {
      await this.prisma.client.session
        .delete({ where: { id: previousId } })
        .catch(() => {
          /* already gone */
        });
    }
    return this.insertSession(userId);
  }

  /**
   * Deletes a session by id. Missing ids are a no-op.
   *
   * @param {string} id - Session id.
   * @returns {Promise<void>}
   */
  async destroy(id: string): Promise<void> {
    await this.prisma.client.session.delete({ where: { id } }).catch(() => {
      /* already gone */
    });
  }

  /**
   * Inserts a new session row.
   *
   * @param {string | null} userId - Owner user id when authenticated.
   * @returns {Promise<AppSession>} The created session.
   */
  private async insertSession(userId: string | null): Promise<AppSession> {
    const id = randomBytes(32).toString('base64url');
    const csrfToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    const row = await this.prisma.client.session.create({
      data: {
        id,
        userId,
        csrfToken,
        expiresAt,
      },
    });
    return toAppSession(row);
  }
}

/**
 * Maps a Prisma session row to the request-facing shape.
 *
 * @param {{ id: string; userId: string | null; csrfToken: string; expiresAt: Date }} row - Persisted row.
 * @returns {AppSession} App session view.
 */
function toAppSession(row: {
  id: string;
  userId: string | null;
  csrfToken: string;
  expiresAt: Date;
}): AppSession {
  return {
    id: row.id,
    userId: row.userId,
    csrfToken: row.csrfToken,
    expiresAt: row.expiresAt,
  };
}
