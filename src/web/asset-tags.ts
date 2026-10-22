import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Stylesheets and module scripts the document shell should emit.
 *
 * Empty lists mean the page ships no client assets.
 */
export interface AssetTags {
  stylesheets: string[];
  scripts: string[];
}

/** One file emitted by the client Vite build. */
export interface ManifestChunk {
  file: string;
  isEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
  css?: string[];
}

/** Vite client manifest keyed by source or chunk id. */
export type ClientManifest = Record<string, ManifestChunk>;

/** No client JavaScript and no stylesheets. */
export const emptyAssetTags: AssetTags = {
  stylesheets: [],
  scripts: [],
};

/**
 * Returns the production path of the Vite client manifest.
 *
 * @returns {string} Absolute path under `dist/client`.
 */
export function clientManifestPath(): string {
  return join(process.cwd(), 'dist/client/.vite/manifest.json');
}

/**
 * Reads a Vite client manifest from disk.
 *
 * @param {string} path - Absolute or relative manifest path.
 * @returns {ClientManifest} Parsed manifest.
 */
export function readClientManifest(path: string): ClientManifest {
  return JSON.parse(readFileSync(path, 'utf8')) as ClientManifest;
}

/**
 * Reads the client manifest from the production build output.
 *
 * @returns {ClientManifest} Manifest at `dist/client/.vite/manifest.json`.
 */
function readBuiltClientManifest(): ClientManifest {
  return readClientManifest(clientManifestPath());
}

let manifestReader: () => ClientManifest = readBuiltClientManifest;

/**
 * Replaces the production manifest reader.
 *
 * Tests pass a stub. Call with `undefined` to read `dist/client` again.
 * Production bootstrap never calls this.
 *
 * @param {(() => ClientManifest) | undefined} reader - Stub reader, or undefined to restore disk.
 * @returns {void}
 */
export function setClientManifestReader(
  reader: (() => ClientManifest) | undefined,
): void {
  manifestReader = reader ?? readBuiltClientManifest;
}

/**
 * Loads the manifest through the current reader.
 *
 * @returns {ClientManifest} Manifest used to build script and style tags.
 */
export function loadClientManifest(): ClientManifest {
  return manifestReader();
}

/**
 * Script tags for the Vite dev server.
 *
 * The browser loads the hydrate entry from source. Island chunks stay
 * behind dynamic import and are not listed here. The React refresh
 * preamble is first because this app serves its own HTML, so Vite never
 * injects the preamble the way it would into `index.html`. Without it,
 * island modules throw before hydration.
 *
 * @returns {AssetTags} Dev client URLs.
 */
export function developmentAssetTags(): AssetTags {
  return {
    stylesheets: [],
    scripts: [
      // Sets window.$RefreshReg$ before any island module evaluates.
      '/@id/@vitejs/plugin-react/preamble',
      '/@vite/client',
      '/src/web/client/hydrate.tsx',
    ],
  };
}

/**
 * Turns a Vite manifest into stylesheet and script URLs.
 *
 * Includes the hydrate entry, its CSS, and static imports such as React.
 * Skips `dynamicImports` so unused island chunks are not preloaded.
 *
 * @param {ClientManifest} manifest - Vite client manifest.
 * @returns {AssetTags} Root-relative asset URLs.
 * @throws {Error} When the manifest has no entry chunk.
 */
export function assetTagsFromManifest(manifest: ClientManifest): AssetTags {
  const entry = Object.values(manifest).find((chunk) => chunk.isEntry);

  if (!entry) {
    throw new Error('Client manifest is missing the hydrate entry.');
  }

  const scripts = [entry.file];
  const stylesheets = [...(entry.css ?? [])];

  for (const key of entry.imports ?? []) {
    const chunk = manifest[key];

    // A missing import key is a bad manifest, not a reason to emit a bad URL.
    if (!chunk) {
      continue;
    }

    scripts.push(chunk.file);

    if (chunk.css) {
      stylesheets.push(...chunk.css);
    }
  }

  return {
    stylesheets: stylesheets.map((file) => `/${file}`),
    scripts: scripts.map((file) => `/${file}`),
  };
}

/**
 * Chooses the asset tags for one rendered page.
 *
 * A page with no islands gets no client JavaScript. Development points at
 * the Vite source entry. Production uses the manifest and still omits
 * island chunks.
 *
 * @param {readonly string[]} islandNames - Island names rendered on the page.
 * @param {{ development: boolean; manifest?: ClientManifest }} source - Where client URLs come from.
 * @returns {AssetTags} Tags for the document shell.
 * @throws {Error} When a production page has islands but no manifest.
 */
export function assetTagsForIslands(
  islandNames: readonly string[],
  source: { development: boolean; manifest?: ClientManifest },
): AssetTags {
  if (islandNames.length === 0) {
    return emptyAssetTags;
  }

  if (source.development) {
    return developmentAssetTags();
  }

  if (!source.manifest) {
    throw new Error(
      'Production pages that render islands need the client manifest.',
    );
  }

  return assetTagsFromManifest(source.manifest);
}
