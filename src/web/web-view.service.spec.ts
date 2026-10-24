import { setClientManifestReader } from './asset-tags.js';
import {
  loadServerEntry,
  setViteDevServer,
  type ServerEntry,
} from './page-loader.js';
import { WebViewService } from './web-view.service.js';

vi.mock('./page-loader.js', async () => {
  const actual =
    await vi.importActual<typeof import('./page-loader.js')>(
      './page-loader.js',
    );

  return {
    ...actual,
    loadServerEntry: vi.fn(actual.loadServerEntry),
  };
});

async function restoreServerEntry(): Promise<void> {
  const actual =
    await vi.importActual<typeof import('./page-loader.js')>(
      './page-loader.js',
    );
  vi.mocked(loadServerEntry).mockImplementation(actual.loadServerEntry);
}

describe('WebViewService', () => {
  afterEach(() => {
    setViteDevServer(undefined);
    setClientManifestReader(undefined);
  });

  it('renders the home page to an HTML document', async () => {
    await restoreServerEntry();
    const html = await new WebViewService().render('home', {
      renderedAt: '2026-10-22T12:00:00.000Z',
    });

    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain(
      'Rendered on the server at 2026-10-22T12:00:00.000Z.',
    );
    expect(html).toContain('data-island="counter"');
    expect(html).toContain('/src/web/styles.css');
    expect(html).toContain('/src/web/client/hydrate.tsx');
    expect(html).not.toContain('assets/counter.js');
  });

  it('uses dev asset tags when vite is registered', async () => {
    const previous = process.env.VITEST;
    delete process.env.VITEST;
    const render: ServerEntry['render'] = async (
      _page,
      _props,
      createAssets,
    ) => {
      const idle = createAssets([]);
      const active = createAssets(['counter']);
      return `${idle.scripts.join(',')}|${active.scripts.join(',')}`;
    };
    vi.mocked(loadServerEntry).mockResolvedValue({ render });
    setViteDevServer({ ssrLoadModule: vi.fn() });

    try {
      const html = await new WebViewService().render('home', {
        renderedAt: 't',
      });

      expect(html).toBe(
        '|/@id/@vitejs/plugin-react/preamble,/@vite/client,/src/web/client/hydrate.tsx',
      );
    } finally {
      process.env.VITEST = previous;
    }
  });

  it('reads the client manifest for production islands', async () => {
    const previous = process.env.VITEST;
    delete process.env.VITEST;
    setClientManifestReader(() => ({
      'src/web/client/hydrate.tsx': {
        file: 'assets/hydrate.js',
        isEntry: true,
        imports: ['_react.js'],
        dynamicImports: ['src/web/islands/counter.tsx'],
        css: ['assets/app.css'],
      },
      '_react.js': { file: 'assets/react.js' },
      'src/web/islands/counter.tsx': { file: 'assets/counter.js' },
      'src/web/styles.css': { file: 'assets/shell.css', isEntry: true },
    }));
    const render: ServerEntry['render'] = async (
      _page,
      _props,
      createAssets,
    ) => {
      const idle = createAssets([]);
      const active = createAssets(['counter']);
      return `${idle.scripts.join(',')}|${active.scripts.join(',')}`;
    };
    vi.mocked(loadServerEntry).mockResolvedValue({ render });

    try {
      const html = await new WebViewService().render('home', {
        renderedAt: 't',
      });

      expect(html).toBe('|/assets/hydrate.js,/assets/react.js');
      expect(html).not.toContain('counter.js');
    } finally {
      process.env.VITEST = previous;
    }
  });
});
