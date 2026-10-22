import { setViteDevServer } from './page-loader.js';
import { WebViewService } from './web-view.service.js';

describe('WebViewService', () => {
  it('renders the home page to an HTML document', async () => {
    const service = new WebViewService();
    const html = await service.render('home', {
      renderedAt: '2026-10-22T12:00:00.000Z',
    });

    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain(
      'Rendered on the server at 2026-10-22T12:00:00.000Z.',
    );
  });

  it('renders through vite when the process is not vitest', async () => {
    const previous = process.env.VITEST;
    delete process.env.VITEST;
    setViteDevServer({
      ssrLoadModule: vi.fn().mockResolvedValue({
        render: vi.fn().mockResolvedValue('<!DOCTYPE html><html></html>'),
      }),
    });

    try {
      const html = await new WebViewService().render('home', {
        renderedAt: 't',
      });

      expect(html).toContain('<!DOCTYPE html>');
    } finally {
      if (previous === undefined) {
        delete process.env.VITEST;
      } else {
        process.env.VITEST = previous;
      }
      setViteDevServer(undefined);
    }
  });
});
