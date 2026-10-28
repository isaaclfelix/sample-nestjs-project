import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { verifyPassword } from '../common/password.js';
import type { UserResponseDto } from '../user/dto/user-response.dto.js';
import { toUserResponseDto } from '../user/user.mapper.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../user/user.repository.js';
import type { LoginDto } from './dto/login.dto.js';
import { clearSessionCookie, setSessionCookie } from './session-cookie.js';
import { SessionService } from './session.service.js';

const INVALID_CREDENTIALS = 'Invalid credentials';

/**
 * Login and logout flows that bind users to cookie sessions.
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly sessions: SessionService,
  ) {}

  /**
   * Authenticates by email or username and regenerates the session.
   *
   * Always returns the same UnauthorizedException message for unknown users
   * and bad passwords. Does not yet require `verified` (tech debt).
   *
   * @param {LoginDto} dto - Identifier and password after Zod validation.
   * @param {Request} req - Request carrying the current guest session.
   * @param {Response} res - Response that receives the new session cookie.
   * @returns {Promise<UserResponseDto>} Public profile of the signed-in user.
   * @throws {UnauthorizedException} When credentials do not match.
   */
  async login(
    dto: LoginDto,
    req: Request,
    res: Response,
  ): Promise<UserResponseDto> {
    // Resolve the account by email or username (case-insensitive).
    const user = await this.users.findByEmailOrUsername(dto.identifier);

    // Verify the password when a user exists; missing users fail the same way.
    const passwordOk =
      user !== null && (await verifyPassword(user.password, dto.password));
    if (!user || !passwordOk) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    // Rotate the session id and CSRF token; attach the authenticated user.
    const previousId = req.session?.id ?? null;
    const session = await this.sessions.regenerate(previousId, user.id);
    setSessionCookie(res, session.id, session.expiresAt);
    req.session = session;

    return toUserResponseDto(user);
  }

  /**
   * Destroys the current session and clears the session cookie.
   *
   * @param {Request} req - Request that may carry a session.
   * @param {Response} res - Response that clears the cookie.
   * @returns {Promise<void>}
   */
  async logout(req: Request, res: Response): Promise<void> {
    const sessionId = req.session?.id;
    if (sessionId) {
      await this.sessions.destroy(sessionId);
    }
    clearSessionCookie(res);
    req.session = undefined;
  }
}
