import { WebController } from './web.controller.js';
import type { WebViewService } from './web-view.service.js';

/**
 * Minimal request stub with an optional CSRF token on the session.
 *
 * @param {string} [csrfToken] - Token SessionMiddleware would attach.
 * @returns {{ session?: { id: string; userId: null; csrfToken: string; expiresAt: Date } }} Request stub.
 */
function reqWithCsrf(csrfToken?: string): {
  session?: {
    id: string;
    userId: null;
    csrfToken: string;
    expiresAt: Date;
  };
} {
  return {
    session: csrfToken
      ? {
          id: 'session-id',
          userId: null,
          csrfToken,
          expiresAt: new Date(),
        }
      : undefined,
  };
}

describe('WebController', () => {
  it('asks the view service for the home page with CSRF', async () => {
    const render = vi.fn().mockResolvedValue('<!DOCTYPE html><html></html>');
    const webViewService = { render } as unknown as WebViewService;
    const controller = new WebController(webViewService);

    await expect(
      controller.home(reqWithCsrf('csrf-home') as never),
    ).resolves.toContain('<!DOCTYPE html>');
    expect(render).toHaveBeenCalledWith(
      'home',
      {
        renderedAt: expect.any(String),
      },
      { csrfToken: 'csrf-home' },
    );
  });

  it('asks the view service for the login page with CSRF', async () => {
    const render = vi.fn().mockResolvedValue('<!DOCTYPE html><html></html>');
    const webViewService = { render } as unknown as WebViewService;
    const controller = new WebController(webViewService);

    await expect(
      controller.login(reqWithCsrf('csrf-login') as never),
    ).resolves.toContain('<!DOCTYPE html>');
    expect(render).toHaveBeenCalledWith(
      'login',
      {},
      { csrfToken: 'csrf-login' },
    );
  });

  it('asks the view service for the register page with CSRF', async () => {
    const render = vi.fn().mockResolvedValue('<!DOCTYPE html><html></html>');
    const webViewService = { render } as unknown as WebViewService;
    const controller = new WebController(webViewService);

    await expect(
      controller.register(reqWithCsrf('csrf-register') as never),
    ).resolves.toContain('<!DOCTYPE html>');
    expect(render).toHaveBeenCalledWith(
      'register',
      {},
      { csrfToken: 'csrf-register' },
    );
  });
});
