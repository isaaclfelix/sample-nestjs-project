import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setClientManifestReader } from './assets/asset-tags.js';
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
      isAuthenticated: false,
    });

    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain(
      'Rendered on the server at 2026-10-22T12:00:00.000Z.',
    );
    expect(html).toContain('data-island="mobile-navigation"');
    expect(html).toContain('/src/web/styles.scss');
    expect(html).toContain('/src/web/island-runtime/hydrate.tsx');
    expect(html).not.toContain('assets/mobile-navigation.js');
  });

  it('uses dev asset tags when vite is registered', async () => {
    const previous = process.env.VITEST;
    delete process.env.VITEST;
    const render: ServerEntry['render'] = async (
      _page,
      _props,
      createAssets,
    ) => {
      const idle = await createAssets([]);
      const active = await createAssets(['mobile-navigation']);
      return `${idle.tags.scripts.join(',')}|${active.tags.scripts.join(',')}`;
    };
    vi.mocked(loadServerEntry).mockResolvedValue({ render });
    setViteDevServer({ ssrLoadModule: vi.fn() });

    try {
      const html = await new WebViewService().render('home', {
        renderedAt: 't',
        isAuthenticated: false,
      });

      expect(html).toBe(
        '/@vite/client|/@id/@vitejs/plugin-react/preamble,/@vite/client,/src/web/island-runtime/hydrate.tsx',
      );
    } finally {
      process.env.VITEST = previous;
    }
  });

  it('passes Vite transformRequest through for island CSS', async () => {
    const previous = process.env.VITEST;
    delete process.env.VITEST;
    const transformRequest = vi.fn(async () => ({
      code: 'const __vite__css = "._c{}";',
    }));
    const render: ServerEntry['render'] = async (
      _page,
      _props,
      createAssets,
    ) => {
      const assets = await createAssets(['mobile-navigation']);
      return assets.islandCss['mobile-navigation'] ?? '';
    };
    vi.mocked(loadServerEntry).mockResolvedValue({ render });
    setViteDevServer({ ssrLoadModule: vi.fn(), transformRequest });

    try {
      const html = await new WebViewService().render('home', {
        renderedAt: 't',
        isAuthenticated: false,
      });

      expect(html).toBe('._c{}');
      expect(transformRequest).toHaveBeenCalled();
    } finally {
      process.env.VITEST = previous;
    }
  });

  it('reads the client manifest for production islands', async () => {
    const previous = process.env.VITEST;
    delete process.env.VITEST;
    const shellPath = join(process.cwd(), 'dist/client/assets/shell.css');
    mkdirSync(join(shellPath, '..'), { recursive: true });
    writeFileSync(shellPath, 'x'.repeat(50 * 1024 + 1));

    setClientManifestReader(() => ({
      'src/web/island-runtime/hydrate.tsx': {
        file: 'assets/hydrate.js',
        isEntry: true,
        imports: ['_react.js'],
        dynamicImports: ['src/web/islands/mobile-navigation.tsx'],
        css: ['assets/app.css'],
      },
      '_react.js': { file: 'assets/react.js' },
      'src/web/islands/mobile-navigation.tsx': {
        file: 'assets/mobile-navigation.js',
      },
      'src/web/styles.scss': { file: 'assets/shell.css', isEntry: true },
    }));
    const render: ServerEntry['render'] = async (
      _page,
      _props,
      createAssets,
    ) => {
      const idle = await createAssets([]);
      const active = await createAssets(['mobile-navigation']);
      return `${idle.tags.scripts.join(',')}|${active.tags.scripts.join(',')}`;
    };
    vi.mocked(loadServerEntry).mockResolvedValue({ render });

    try {
      const html = await new WebViewService().render('home', {
        renderedAt: 't',
        isAuthenticated: false,
      });

      expect(html).toBe('|/assets/hydrate.js,/assets/react.js');
      expect(html).not.toContain('mobile-navigation.js');
    } finally {
      process.env.VITEST = previous;
    }
  });
});
