import type { NextFunction, Request, Response } from 'express';
import { SessionMiddleware } from './session.middleware.js';
import type { SessionService } from './session.service.js';

vi.mock('./session-path.js', () => ({
  shouldAttachSession: vi.fn(),
}));

vi.mock('./session-cookie.js', () => ({
  readSessionId: vi.fn(),
  setSessionCookie: vi.fn(),
}));

import { shouldAttachSession } from './session-path.js';
import { readSessionId, setSessionCookie } from './session-cookie.js';

describe('SessionMiddleware', () => {
  const sessions = {
    findById: vi.fn(),
    createGuest: vi.fn(),
  };
  const middleware = new SessionMiddleware(
    sessions as unknown as SessionService,
  );
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it('skips session work when the path does not need a session', async () => {
    vi.mocked(shouldAttachSession).mockReturnValue(false);
    const req = { path: '/assets/x.js' } as Request;
    const res = {} as Response;

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(sessions.findById).not.toHaveBeenCalled();
  });

  it('reattaches an existing live session without setting a cookie', async () => {
    vi.mocked(shouldAttachSession).mockReturnValue(true);
    vi.mocked(readSessionId).mockReturnValue('sid');
    const live = {
      id: 'sid',
      userId: 'u1',
      csrfToken: 'csrf',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    };
    sessions.findById.mockResolvedValue(live);
    const req = { path: '/' } as Request;
    const res = {} as Response;

    await middleware.use(req, res, next);

    expect(req.session).toEqual(live);
    expect(setSessionCookie).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('mints a guest session when the cookie is missing', async () => {
    vi.mocked(shouldAttachSession).mockReturnValue(true);
    vi.mocked(readSessionId).mockReturnValue(undefined);
    const guest = {
      id: 'new',
      userId: null,
      csrfToken: 'csrf',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    };
    sessions.createGuest.mockResolvedValue(guest);
    const req = { path: '/login' } as Request;
    const res = {} as Response;

    await middleware.use(req, res, next);

    expect(sessions.findById).not.toHaveBeenCalled();
    expect(setSessionCookie).toHaveBeenCalledWith(
      res,
      guest.id,
      guest.expiresAt,
    );
    expect(req.session).toEqual(guest);
    expect(next).toHaveBeenCalledWith();
  });

  it('mints a guest session when the existing id is expired', async () => {
    vi.mocked(shouldAttachSession).mockReturnValue(true);
    vi.mocked(readSessionId).mockReturnValue('stale');
    sessions.findById.mockResolvedValue(null);
    const guest = {
      id: 'fresh',
      userId: null,
      csrfToken: 'csrf',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    };
    sessions.createGuest.mockResolvedValue(guest);
    const req = { path: '/api/user' } as Request;
    const res = {} as Response;

    await middleware.use(req, res, next);

    expect(setSessionCookie).toHaveBeenCalled();
    expect(req.session).toEqual(guest);
  });

  it('forwards errors to next', async () => {
    vi.mocked(shouldAttachSession).mockReturnValue(true);
    vi.mocked(readSessionId).mockReturnValue('sid');
    const error = new Error('db down');
    sessions.findById.mockRejectedValue(error);
    const req = { path: '/' } as Request;
    const res = {} as Response;

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
