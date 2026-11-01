import type { ArchipielagoViewService } from '@archipielago/nestjs/archipielago-view.service.js';
import { WebController } from './web.controller.js';

/**
 * Minimal request stub with an optional session (CSRF + optional user).
 *
 * @param {{ csrfToken?: string; userId?: string | null }} [options] - Session fields.
 * @returns {{ session?: { id: string; userId: string | null; csrfToken: string; expiresAt: Date }; redirect?: ReturnType<typeof vi.fn> }}
 *   Request stub; include `redirect` on a paired response mock when needed.
 */
function reqWithSession(options?: {
  csrfToken?: string;
  userId?: string | null;
}): {
  session?: {
    id: string;
    userId: string | null;
    csrfToken: string;
    expiresAt: Date;
  };
} {
  const csrfToken = options?.csrfToken;
  return {
    session: csrfToken
      ? {
          id: 'session-id',
          userId: options?.userId ?? null,
          csrfToken,
          expiresAt: new Date(),
        }
      : undefined,
  };
}

describe('WebController', () => {
  it('asks the view service for the home page with CSRF and auth flag', async () => {
    const render = vi.fn().mockResolvedValue('<!DOCTYPE html><html></html>');
    const viewService = { render } as unknown as ArchipielagoViewService;
    const controller = new WebController(viewService);

    await expect(
      controller.home(reqWithSession({ csrfToken: 'csrf-home' }) as never),
    ).resolves.toContain('<!DOCTYPE html>');
    expect(render).toHaveBeenCalledWith(
      'home',
      {
        renderedAt: expect.any(String),
        isAuthenticated: false,
      },
      { csrfToken: 'csrf-home' },
    );
  });

  it('passes isAuthenticated true on home when the session has a user', async () => {
    const render = vi.fn().mockResolvedValue('<!DOCTYPE html><html></html>');
    const viewService = { render } as unknown as ArchipielagoViewService;
    const controller = new WebController(viewService);

    await controller.home(
      reqWithSession({ csrfToken: 'csrf-home', userId: 'user-1' }) as never,
    );

    expect(render).toHaveBeenCalledWith(
      'home',
      {
        renderedAt: expect.any(String),
        isAuthenticated: true,
      },
      { csrfToken: 'csrf-home' },
    );
  });

  it('asks the view service for the login page with CSRF', async () => {
    const render = vi.fn().mockResolvedValue('<!DOCTYPE html><html></html>');
    const viewService = { render } as unknown as ArchipielagoViewService;
    const controller = new WebController(viewService);
    const res = { redirect: vi.fn() };

    await expect(
      controller.login(
        reqWithSession({ csrfToken: 'csrf-login' }) as never,
        res as never,
      ),
    ).resolves.toContain('<!DOCTYPE html>');
    expect(res.redirect).not.toHaveBeenCalled();
    expect(render).toHaveBeenCalledWith(
      'login',
      { isAuthenticated: false },
      { csrfToken: 'csrf-login' },
    );
  });

  it('redirects authenticated users away from login', () => {
    const render = vi.fn();
    const viewService = { render } as unknown as ArchipielagoViewService;
    const controller = new WebController(viewService);
    const res = { redirect: vi.fn() };

    const result = controller.login(
      reqWithSession({
        csrfToken: 'csrf-login',
        userId: 'user-1',
      }) as never,
      res as never,
    );

    expect(result).toBeUndefined();
    expect(res.redirect).toHaveBeenCalledWith('/');
    expect(render).not.toHaveBeenCalled();
  });

  it('asks the view service for the register page with CSRF', async () => {
    const render = vi.fn().mockResolvedValue('<!DOCTYPE html><html></html>');
    const viewService = { render } as unknown as ArchipielagoViewService;
    const controller = new WebController(viewService);
    const res = { redirect: vi.fn() };

    await expect(
      controller.register(
        reqWithSession({ csrfToken: 'csrf-register' }) as never,
        res as never,
      ),
    ).resolves.toContain('<!DOCTYPE html>');
    expect(res.redirect).not.toHaveBeenCalled();
    expect(render).toHaveBeenCalledWith(
      'register',
      { isAuthenticated: false },
      { csrfToken: 'csrf-register' },
    );
  });

  it('redirects authenticated users away from register', () => {
    const render = vi.fn();
    const viewService = { render } as unknown as ArchipielagoViewService;
    const controller = new WebController(viewService);
    const res = { redirect: vi.fn() };

    const result = controller.register(
      reqWithSession({
        csrfToken: 'csrf-register',
        userId: 'user-1',
      }) as never,
      res as never,
    );

    expect(result).toBeUndefined();
    expect(res.redirect).toHaveBeenCalledWith('/');
    expect(render).not.toHaveBeenCalled();
  });
});
