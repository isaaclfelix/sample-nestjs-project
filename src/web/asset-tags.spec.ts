import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assetTagsFromManifest,
  clientManifestPath,
  developmentAssetTags,
  developmentShellOnlyAssetTags,
  loadClientManifest,
  pageStylesheetFromManifest,
  pageStylesheetHrefs,
  readClientManifest,
  setClientManifestReader,
  type ClientManifest,
} from './asset-tags.js';
import { createPageAssets } from './page-assets.js';

const manifest: ClientManifest = {
  'src/web/client/hydrate.tsx': {
    file: 'assets/hydrate.js',
    isEntry: true,
    imports: ['_react.js', 'missing.js', 'plain.js'],
    dynamicImports: [
      'src/web/islands/mobile-navigation.tsx',
      'src/web/islands/chart.tsx',
    ],
    css: ['assets/app.css'],
  },
  '_react.js': { file: 'assets/react.js', css: ['assets/react.css'] },
  'plain.js': { file: 'assets/plain.js' },
  'src/web/islands/mobile-navigation.tsx': {
    file: 'assets/mobile-navigation.js',
  },
  'src/web/islands/chart.tsx': { file: 'assets/chart.js' },
  'src/web/styles.scss': { file: 'assets/shell.css', isEntry: true },
  'src/web/styles/forms.scss': { file: 'assets/forms.css', isEntry: true },
};

describe('asset tags', () => {
  afterEach(() => {
    setClientManifestReader(undefined);
  });

  it('uses shell-only development tags when the page has no islands', async () => {
    await expect(createPageAssets([], { development: true })).resolves.toEqual({
      tags: developmentShellOnlyAssetTags(),
      islandCss: {},
    });
  });

  it('appends opt-in forms stylesheet links in development', async () => {
    const assets = await createPageAssets([], {
      development: true,
      pageStylesheets: ['forms'],
    });

    expect(assets.tags.stylesheets).toEqual([
      ...developmentShellOnlyAssetTags().stylesheets,
      '/src/web/styles/forms.scss',
    ]);
  });

  it('points development pages at the vite source entry', async () => {
    await expect(
      createPageAssets(['mobile-navigation'], { development: true }),
    ).resolves.toEqual({
      tags: developmentAssetTags(),
      islandCss: {},
    });
  });

  it('resolves production page stylesheet hrefs from the manifest', () => {
    expect(pageStylesheetFromManifest(manifest, 'forms')).toBe(
      '/assets/forms.css',
    );
    expect(
      pageStylesheetHrefs(['forms'], { development: false, manifest }),
    ).toEqual(['/assets/forms.css']);
    expect(pageStylesheetHrefs(['forms'], { development: true })).toEqual([
      '/src/web/styles/forms.scss',
    ]);
    expect(pageStylesheetHrefs([], { development: false, manifest })).toEqual(
      [],
    );
  });

  it('throws when production page stylesheets lack a manifest', () => {
    expect(() =>
      pageStylesheetHrefs(['forms'], { development: false }),
    ).toThrow('Production pages need the client manifest.');
  });

  it('links the shell and the runtime, not island chunks', async () => {
    const shellPath = join(process.cwd(), 'dist/client/assets/shell.css');
    mkdirSync(join(shellPath, '..'), { recursive: true });
    // Over budget so production keeps a <link> (fixture oversized CSS).
    writeFileSync(shellPath, 'x'.repeat(50 * 1024 + 1));

    const { tags } = await createPageAssets(['mobile-navigation'], {
      development: false,
      manifest,
    });

    expect(tags.stylesheets[0]).toBe('/assets/shell.css');
    expect(tags.stylesheets).toContain('/assets/app.css');
    expect(tags.inlineStyles).toEqual([]);
    expect(tags.scripts.join(' ')).not.toContain('mobile-navigation');
  });

  it('emits the entry and static imports, not island chunks', () => {
    const tags = assetTagsFromManifest(manifest);

    expect(tags.scripts).toEqual([
      '/assets/hydrate.js',
      '/assets/react.js',
      '/assets/plain.js',
    ]);
    expect(tags.stylesheets).toEqual(['/assets/app.css', '/assets/react.css']);
    expect(tags.inlineStyles).toEqual([]);
    expect(tags.scripts.join(' ')).not.toContain('shell');
    expect(tags.scripts.join(' ')).not.toContain('mobile-navigation');
    expect(tags.scripts.join(' ')).not.toContain('chart');
  });

  it('allows an entry with no css and no imports', () => {
    expect(
      assetTagsFromManifest({
        only: { file: 'assets/hydrate.js', isEntry: true },
      }),
    ).toEqual({
      stylesheets: [],
      inlineStyles: [],
      scripts: ['/assets/hydrate.js'],
    });
  });

  it('throws when the manifest has no entry', () => {
    expect(() => assetTagsFromManifest({})).toThrow(
      'Client manifest is missing the hydrate entry.',
    );
  });

  it('throws in production when the manifest is missing', async () => {
    await expect(createPageAssets([], { development: false })).rejects.toThrow(
      'Production pages need the client manifest.',
    );
  });

  it('throws when the manifest has no shell stylesheet', async () => {
    await expect(
      createPageAssets([], {
        development: false,
        manifest: {
          'src/web/client/hydrate.tsx': {
            file: 'assets/hydrate.js',
            isEntry: true,
          },
        },
      }),
    ).rejects.toThrow('Client manifest is missing the shell stylesheet.');
  });

  it('reads a manifest file from disk', () => {
    const dir = mkdtempSync(join(tmpdir(), 'manifest-'));
    const path = join(dir, 'manifest.json');
    const payload = { entry: { file: 'a.js', isEntry: true } };
    writeFileSync(path, JSON.stringify(payload));

    expect(readClientManifest(path)).toEqual(payload);
    expect(clientManifestPath()).toContain('dist/client/.vite/manifest.json');

    const builtPath = clientManifestPath();
    const previous = existsSync(builtPath)
      ? readFileSync(builtPath, 'utf8')
      : undefined;
    mkdirSync(join(builtPath, '..'), { recursive: true });
    writeFileSync(builtPath, JSON.stringify(payload));

    try {
      setClientManifestReader(undefined);
      expect(loadClientManifest()).toEqual(payload);
    } finally {
      if (previous === undefined) {
        rmSync(builtPath);
      } else {
        writeFileSync(builtPath, previous);
      }
    }
  });
});
