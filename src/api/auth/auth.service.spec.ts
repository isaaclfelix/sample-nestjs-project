import { UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { verifyPassword } from '../common/password.js';
import type { User } from '../user/entities/user.entity.js';
import type { UserRepository } from '../user/user.repository.js';
import { AuthService } from './auth.service.js';
import type { SessionService } from './session.service.js';

vi.mock('../common/password.js', () => ({
  verifyPassword: vi.fn(),
}));

/**
 * Builds a domain user for auth tests.
 *
 * @param {Partial<User>} [overrides] - Fields to override.
 * @returns {User} Domain user.
 */
function user(overrides: Partial<User> = {}): User {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'ada@example.com',
    username: 'Ada_Lovelace',
    displayName: 'Ada Lovelace',
    password: 'hash(correct-horse)',
    verified: false,
    ...overrides,
  };
}

describe('AuthService', () => {
  const users = {
    findByEmailOrUsername: vi.fn(),
  };
  const sessions = {
    regenerate: vi.fn(),
    destroy: vi.fn(),
  };
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService(
      users as unknown as UserRepository,
      sessions as unknown as SessionService,
    );
  });

  describe('login', () => {
    it('regenerates the session and returns the public user', async () => {
      const stored = user();
      users.findByEmailOrUsername.mockResolvedValue(stored);
      vi.mocked(verifyPassword).mockResolvedValue(true);
      sessions.regenerate.mockResolvedValue({
        id: 'new-sid',
        userId: stored.id,
        csrfToken: 'new-csrf',
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      });
      const req = {
        session: {
          id: 'old-sid',
          userId: null,
          csrfToken: 'old',
          expiresAt: new Date(),
        },
      } as Request;
      const append = vi.fn();
      const res = { append } as unknown as Response;

      const result = await service.login(
        { identifier: 'ada@example.com', password: 'correct-horse' },
        req,
        res,
      );

      expect(result).toEqual({
        id: stored.id,
        email: stored.email,
        username: stored.username,
        displayName: stored.displayName,
        verified: false,
      });
      expect(sessions.regenerate).toHaveBeenCalledWith('old-sid', stored.id);
      expect(append).toHaveBeenCalled();
      expect(req.session?.id).toBe('new-sid');
    });

    it('throws the same error for unknown users and bad passwords', async () => {
      users.findByEmailOrUsername.mockResolvedValue(null);
      const req = { session: undefined } as Request;
      const res = { append: vi.fn() } as unknown as Response;

      await expect(
        service.login(
          { identifier: 'missing@example.com', password: 'correct-horse' },
          req,
          res,
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      users.findByEmailOrUsername.mockResolvedValue(user());
      vi.mocked(verifyPassword).mockResolvedValue(false);

      await expect(
        service.login(
          { identifier: 'ada@example.com', password: 'correct-horse' },
          req,
          res,
        ),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('destroys the session and clears the cookie', async () => {
      sessions.destroy.mockResolvedValue(undefined);
      const req = {
        session: {
          id: 'sid',
          userId: 'u1',
          csrfToken: 't',
          expiresAt: new Date(),
        },
      } as Request;
      const append = vi.fn();
      const res = { append } as unknown as Response;

      await service.logout(req, res);

      expect(sessions.destroy).toHaveBeenCalledWith('sid');
      expect(append).toHaveBeenCalled();
      expect(req.session).toBeUndefined();
    });
  });
});
