import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setClientManifestReader } from '@archipielago/vite/asset-delivery/asset-tags.js';
import {
  loadServerEntry,
  setViteDevServer,
  type ServerEntry,
} from '@archipielago/vite/page-loader.js';
import { ArchipielagoViewService } from './archipielago-view.service.js';

vi.mock('@archipielago/vite/page-loader.js', async () => {
  const actual = await vi.importActual<
    typeof import('@archipielago/vite/page-loader.js')
  >('@archipielago/vite/page-loader.js');

  return {
    ...actual,
    loadServerEntry: vi.fn(),
  };
});

describe('ArchipielagoViewService', () => {
  afterEach(() => {
    setViteDevServer(undefined);
    setClientManifestReader(undefined);
    vi.mocked(loadServerEntry).mockReset();
  });

  it('returns the entry HTML and loads the server entry for vitest', async () => {
    const render: ServerEntry['render'] = async (
      page,
      props,
      createAssets,
      csrfToken,
    ) => {
      const assets = await createAssets(['mobile-navigation']);
      return {
        html: [
          '<!DOCTYPE html>',
          `page=${page}`,
          `at=${String((props as { renderedAt: string }).renderedAt)}`,
          `csrf=${csrfToken ?? ''}`,
          assets.tags.stylesheets.join(','),
          assets.tags.scripts.join(','),
        ].join('|'),
        assets,
      };
    };
    vi.mocked(loadServerEntry).mockResolvedValue({ render });

    const html = await new ArchipielagoViewService({
      getPageStylesheets: () => ['forms'],
    }).render(
      'home',
      {
        renderedAt: '2026-10-22T12:00:00.000Z',
        isAuthenticated: false,
      },
      { csrfToken: 'csrf-token' },
    );

    expect(loadServerEntry).toHaveBeenCalledWith({
      vite: undefined,
      vitest: true,
    });
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('page=home');
    expect(html).toContain('at=2026-10-22T12:00:00.000Z');
    expect(html).toContain('csrf=csrf-token');
    expect(html).toContain('/src/web/ui/styles/shell.scss');
    expect(html).toContain('/src/web/ui/styles/forms.scss');
    expect(html).toContain('/src/web/ui/runtime/island/hydrate-entry.tsx');
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
      return {
        html: `${idle.tags.scripts.join(',')}|${active.tags.scripts.join(',')}`,
        assets: active,
      };
    };
    vi.mocked(loadServerEntry).mockResolvedValue({ render });
    setViteDevServer({ ssrLoadModule: vi.fn() });

    try {
      const html = await new ArchipielagoViewService().render('home', {
        renderedAt: 't',
        isAuthenticated: false,
      });

      expect(html).toBe(
        '/@vite/client|/@id/@vitejs/plugin-react/preamble,/@vite/client,/src/web/ui/runtime/island/hydrate-entry.tsx',
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
      return {
        html: assets.islandCss['mobile-navigation'] ?? '',
        assets,
      };
    };
    vi.mocked(loadServerEntry).mockResolvedValue({ render });
    setViteDevServer({ ssrLoadModule: vi.fn(), transformRequest });

    try {
      const html = await new ArchipielagoViewService().render('home', {
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
      'src/web/ui/runtime/island/hydrate-entry.tsx': {
        file: 'assets/hydrate.js',
        isEntry: true,
        imports: ['_react.js'],
        dynamicImports: [
          'src/web/ui/islands/mobile-navigation/mobile-navigation.tsx',
        ],
        css: ['assets/app.css'],
      },
      '_react.js': { file: 'assets/react.js' },
      'src/web/ui/islands/mobile-navigation/mobile-navigation.tsx': {
        file: 'assets/mobile-navigation.js',
      },
      'src/web/ui/styles/shell.scss': {
        file: 'assets/shell.css',
        isEntry: true,
      },
    }));
    const render: ServerEntry['render'] = async (
      _page,
      _props,
      createAssets,
    ) => {
      const idle = await createAssets([]);
      const active = await createAssets(['mobile-navigation']);
      return {
        html: `${idle.tags.scripts.join(',')}|${active.tags.scripts.join(',')}`,
        assets: active,
      };
    };
    vi.mocked(loadServerEntry).mockResolvedValue({ render });

    try {
      const html = await new ArchipielagoViewService().render('home', {
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
