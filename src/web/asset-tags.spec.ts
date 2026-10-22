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
};

describe('asset tags', () => {
  afterEach(() => {
    setClientManifestReader(undefined);
  });

  it('omits the client runtime when the page has no islands', () => {
    expect(assetTagsForIslands([], { development: true }).scripts).toEqual([]);
    expect(
      assetTagsForIslands([], { development: false, manifest }).scripts,
    ).toEqual([]);
  });

  it('points development pages at the vite source entry', () => {
    expect(assetTagsForIslands(['counter'], { development: true })).toEqual(
      developmentAssetTags(),
    );
  });

  it('emits the entry and static imports, not island chunks', () => {
    const tags = assetTagsFromManifest(manifest);

    expect(tags.scripts).toEqual([
      '/assets/hydrate.js',
      '/assets/react.js',
      '/assets/plain.js',
    ]);
    expect(tags.stylesheets).toEqual(['/assets/app.css', '/assets/react.css']);
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

  it('throws in production when islands are rendered without a manifest', () => {
    expect(() =>
      assetTagsForIslands(['counter'], { development: false }),
    ).toThrow('Production pages that render islands need the client manifest.');
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
