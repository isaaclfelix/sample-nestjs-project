import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ClientManifest } from './asset-tags.js';
import * as registry from './islands/registry.js';
import {
  createPageAssets,
  extractCssFromViteModule,
  islandCssFromManifest,
  islandCssFromVite,
  loadShellCssText,
  shellStyleTags,
} from './page-assets.js';

describe('extractCssFromViteModule', () => {
  it('parses a Vite CSS-module __vite__css string', () => {
    const code = `const __vite__css = "._a{color:red}";\nexport default {};`;
    expect(extractCssFromViteModule(code)).toBe('._a{color:red}');
  });

  it('returns plain CSS unchanged', () => {
    expect(extractCssFromViteModule('body{margin:0}')).toBe('body{margin:0}');
  });

  it('returns empty when the transform is JS without embedded CSS', () => {
    expect(extractCssFromViteModule('export default { count: "._a" };')).toBe(
      '',
    );
  });
});

describe('shellStyleTags', () => {
  const manifest: ClientManifest = {
    'src/web/styles.scss': { file: 'assets/shell.css', isEntry: true },
  };

  it('inlines when under budget', () => {
    expect(shellStyleTags(manifest, '.x{}', 100)).toEqual({
      stylesheets: [],
      inlineStyles: [{ id: 'shell', css: '.x{}' }],
    });
  });

  it('links when over budget', () => {
    const css = 'y'.repeat(20);
    expect(shellStyleTags(manifest, css, 10)).toEqual({
      stylesheets: ['/assets/shell.css'],
      inlineStyles: [],
    });
  });
});

describe('loadShellCssText', () => {
  it('reads the shell file from dist/client', () => {
    const dir = join(process.cwd(), 'dist/client/assets');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'shell-load.css'), 'body{color:red}');

    const manifest: ClientManifest = {
      'src/web/styles.scss': { file: 'assets/shell-load.css', isEntry: true },
    };

    expect(loadShellCssText(manifest)).toBe('body{color:red}');
  });
});

describe('islandCssFromManifest', () => {
  it('reads css files listed on the island chunk', () => {
    const dir = join(process.cwd(), 'dist/client/assets');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'counter-test.css'), '._c{opacity:1}');

    const manifest: ClientManifest = {
      'src/web/islands/counter.tsx': {
        file: 'assets/counter.js',
        css: ['assets/counter-test.css'],
      },
    };

    expect(islandCssFromManifest(manifest, ['counter'])).toEqual({
      counter: '._c{opacity:1}',
    });
  });

  it('skips unknown names and chunks without css', () => {
    const manifest: ClientManifest = {
      'src/web/islands/counter.tsx': { file: 'assets/counter.js' },
    };

    expect(islandCssFromManifest(manifest, ['nope', 'counter'])).toEqual({});
  });
});

describe('islandCssFromVite', () => {
  it('transforms registered module URLs and skips others', async () => {
    const vite = {
      transformRequest: vi.fn(async (url: string) => {
        if (url.includes('counter')) {
          return { code: 'const __vite__css = "._c{font-weight:700}";' };
        }
        return null;
      }),
    };

    await expect(islandCssFromVite(['nope', 'counter'], vite)).resolves.toEqual(
      {
        counter: '._c{font-weight:700}',
      },
    );
    expect(vite.transformRequest).toHaveBeenCalledWith(
      '/src/web/islands/counter.module.scss',
    );
  });

  it('omits islands when transform returns no code', async () => {
    const vite = {
      transformRequest: vi.fn(async () => null),
    };

    await expect(islandCssFromVite(['counter'], vite)).resolves.toEqual({});
  });

  it('skips islands that have no cssModulePath', async () => {
    const spy = vi
      .spyOn(registry, 'islandCssModuleUrl')
      .mockReturnValue(undefined);
    const vite = { transformRequest: vi.fn() };

    try {
      await expect(islandCssFromVite(['counter'], vite)).resolves.toEqual({});
      expect(vite.transformRequest).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});

describe('createPageAssets island CSS', () => {
  it('loads island CSS through Vite in development', async () => {
    const vite = {
      transformRequest: vi.fn(async () => ({
        code: 'const __vite__css = "._d{display:block}";',
      })),
    };

    const assets = await createPageAssets(['counter'], {
      development: true,
      vite,
    });

    expect(assets.islandCss).toEqual({ counter: '._d{display:block}' });
  });

  it('inlines a small production shell and island CSS', async () => {
    const dir = join(process.cwd(), 'dist/client/assets');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'shell-small.css'), '.ok{}');
    writeFileSync(join(dir, 'island-small.css'), '._i{}');

    const manifest: ClientManifest = {
      'src/web/client/hydrate.tsx': {
        file: 'assets/hydrate.js',
        isEntry: true,
      },
      'src/web/styles.scss': { file: 'assets/shell-small.css', isEntry: true },
      'src/web/islands/counter.tsx': {
        file: 'assets/counter.js',
        css: ['assets/island-small.css'],
      },
    };

    const idle = await createPageAssets([], {
      development: false,
      manifest,
    });
    expect(idle.tags.inlineStyles).toEqual([{ id: 'shell', css: '.ok{}' }]);
    expect(idle.tags.stylesheets).toEqual([]);
    expect(idle.tags.scripts).toEqual([]);

    const active = await createPageAssets(['counter'], {
      development: false,
      manifest,
    });
    expect(active.tags.inlineStyles).toEqual([{ id: 'shell', css: '.ok{}' }]);
    expect(active.islandCss).toEqual({ counter: '._i{}' });
    expect(active.tags.scripts).toContain('/assets/hydrate.js');
  });
});
