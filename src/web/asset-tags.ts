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

/** Dev URL for the shared sheet. Vite serves it as CSS for a stylesheet link. */
export const shellStylesheetDev = '/src/web/styles.css';

/** Manifest key for the shared sheet, which is its own client build input. */
const shellStylesheetSource = 'src/web/styles.css';

/** Manifest key for the browser hydrate entry. */
const hydrateEntrySource = 'src/web/client/hydrate.tsx';

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
 * The shared sheet is a head link so the first paint is styled. Island CSS
 * stays on each island chunk and is not listed here.
 *
 * @returns {AssetTags} Dev client URLs.
 */
export function developmentAssetTags(): AssetTags {
  return {
    stylesheets: [shellStylesheetDev],
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
  const entry = hydrateEntryChunk(manifest);

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
 * Returns the shared stylesheet URL from a production manifest.
 *
 * The shell is its own build input, so its CSS is not on the hydrate chunk.
 * A CSS-only entry stores the path on `file`. An entry that also emits a
 * script stores it on `css`. The script is not linked.
 *
 * @param {ClientManifest} manifest - Vite client manifest.
 * @returns {string} Root-relative stylesheet URL.
 * @throws {Error} When the shell chunk is missing.
 */
export function shellStylesheetFromManifest(manifest: ClientManifest): string {
  const chunk = manifest[shellStylesheetSource];
  const file =
    chunk?.css?.[0] ?? (chunk?.file.endsWith('.css') ? chunk.file : undefined);

  if (!file) {
    throw new Error('Client manifest is missing the shell stylesheet.');
  }

  return `/${file}`;
}

/**
 * Chooses the asset tags for one rendered page.
 *
 * Every page links the shared sheet. A page with no islands gets no client
 * JavaScript. Development points at the Vite source entry. Production uses
 * the manifest and still omits island chunks and their CSS.
 *
 * @param {readonly string[]} islandNames - Island names rendered on the page.
 * @param {{ development: boolean; manifest?: ClientManifest }} source - Where client URLs come from.
 * @returns {AssetTags} Tags for the document shell.
 * @throws {Error} When a production page has no manifest, or the manifest has no shell.
 */
export function assetTagsForIslands(
  islandNames: readonly string[],
  source: { development: boolean; manifest?: ClientManifest },
): AssetTags {
  if (source.development) {
    if (islandNames.length === 0) {
      return { stylesheets: [shellStylesheetDev], scripts: [] };
    }

    return developmentAssetTags();
  }

  if (!source.manifest) {
    throw new Error('Production pages need the client manifest.');
  }

  const shell = shellStylesheetFromManifest(source.manifest);

  if (islandNames.length === 0) {
    return { stylesheets: [shell], scripts: [] };
  }

  const runtime = assetTagsFromManifest(source.manifest);

  return {
    stylesheets: [
      shell,
      ...runtime.stylesheets.filter((href) => href !== shell),
    ],
    scripts: runtime.scripts,
  };
}

/**
 * Returns the hydrate entry chunk.
 *
 * Prefers the source path so the shell input, which is also an entry, is
 * not used as the script list. Tests may use another `isEntry` JavaScript file.
 *
 * @param {ClientManifest} manifest - Vite client manifest.
 * @returns {ManifestChunk | undefined} The hydrate chunk, when present.
 */
function hydrateEntryChunk(
  manifest: ClientManifest,
): ManifestChunk | undefined {
  const named = manifest[hydrateEntrySource];

  if (named) {
    return named;
  }

  return Object.values(manifest).find(
    (chunk) => chunk.isEntry === true && chunk.file.endsWith('.js'),
  );
}
