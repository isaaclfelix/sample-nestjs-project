import { WebController } from './web.controller.js';
import type { WebViewService } from './web-view.service.js';

describe('WebController', () => {
  it('asks the view service for the home page', async () => {
    const render = vi.fn().mockResolvedValue('<!DOCTYPE html><html></html>');
    const webViewService = { render } as unknown as WebViewService;
    const controller = new WebController(webViewService);

    await expect(controller.home()).resolves.toContain('<!DOCTYPE html>');
    expect(render).toHaveBeenCalledWith('home', {
      renderedAt: expect.any(String),
    });
  });

  it('asks the view service for the login page', async () => {
    const render = vi.fn().mockResolvedValue('<!DOCTYPE html><html></html>');
    const webViewService = { render } as unknown as WebViewService;
    const controller = new WebController(webViewService);

    await expect(controller.login()).resolves.toContain('<!DOCTYPE html>');
    expect(render).toHaveBeenCalledWith('login', {});
  });
});
