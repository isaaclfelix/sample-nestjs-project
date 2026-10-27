import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ClientManifest } from './asset-tags.js';
import {
  extractCssFromViteModule,
  islandCssFromManifest,
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
});
