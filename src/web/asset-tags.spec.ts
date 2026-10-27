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
  assetTagsForIslands,
  assetTagsFromManifest,
  clientManifestPath,
  developmentAssetTags,
  developmentShellOnlyAssetTags,
  loadClientManifest,
  readClientManifest,
  setClientManifestReader,
  type ClientManifest,
} from './asset-tags.js';

const manifest: ClientManifest = {
  'src/web/client/hydrate.tsx': {
    file: 'assets/hydrate.js',
    isEntry: true,
    imports: ['_react.js', 'missing.js', 'plain.js'],
    dynamicImports: [
      'src/web/islands/counter.tsx',
      'src/web/islands/chart.tsx',
    ],
    css: ['assets/app.css'],
  },
  '_react.js': { file: 'assets/react.js', css: ['assets/react.css'] },
  'plain.js': { file: 'assets/plain.js' },
  'src/web/islands/counter.tsx': { file: 'assets/counter.js' },
  'src/web/islands/chart.tsx': { file: 'assets/chart.js' },
  'src/web/styles.scss': { file: 'assets/shell.css', isEntry: true },
};

describe('asset tags', () => {
  afterEach(() => {
    setClientManifestReader(undefined);
  });

  it('links only the shell when the page has no islands', () => {
    expect(assetTagsForIslands([], { development: true })).toEqual(
      developmentShellOnlyAssetTags(),
    );
    expect(assetTagsForIslands([], { development: false, manifest })).toEqual({
      stylesheets: ['/assets/shell.css'],
      scripts: [],
    });
  });

  it('points development pages at the vite source entry', () => {
    expect(assetTagsForIslands(['counter'], { development: true })).toEqual(
      developmentAssetTags(),
    );
  });

  it('links the shell and the runtime, not island chunks', () => {
    const tags = assetTagsForIslands(['counter'], {
      development: false,
      manifest,
    });

    expect(tags.stylesheets[0]).toBe('/assets/shell.css');
    expect(tags.stylesheets).toContain('/assets/app.css');
    expect(tags.scripts.join(' ')).not.toContain('counter');
  });

  it('emits the entry and static imports, not island chunks', () => {
    const tags = assetTagsFromManifest(manifest);

    expect(tags.scripts).toEqual([
      '/assets/hydrate.js',
      '/assets/react.js',
      '/assets/plain.js',
    ]);
    expect(tags.stylesheets).toEqual(['/assets/app.css', '/assets/react.css']);
    expect(tags.scripts.join(' ')).not.toContain('shell');
    expect(tags.scripts.join(' ')).not.toContain('counter');
    expect(tags.scripts.join(' ')).not.toContain('chart');
  });

  it('allows an entry with no css and no imports', () => {
    expect(
      assetTagsFromManifest({
        only: { file: 'assets/hydrate.js', isEntry: true },
      }),
    ).toEqual({
      stylesheets: [],
      scripts: ['/assets/hydrate.js'],
    });
  });

  it('throws when the manifest has no entry', () => {
    expect(() => assetTagsFromManifest({})).toThrow(
      'Client manifest is missing the hydrate entry.',
    );
  });

  it('throws in production when the manifest is missing', () => {
    expect(() => assetTagsForIslands([], { development: false })).toThrow(
      'Production pages need the client manifest.',
    );
  });

  it('throws when the manifest has no shell stylesheet', () => {
    expect(() =>
      assetTagsForIslands([], {
        development: false,
        manifest: {
          'src/web/client/hydrate.tsx': {
            file: 'assets/hydrate.js',
            isEntry: true,
          },
        },
      }),
    ).toThrow('Client manifest is missing the shell stylesheet.');
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
