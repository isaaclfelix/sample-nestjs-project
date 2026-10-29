import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  emptyAssetTags,
  type AssetTags,
  type InlineStyleTag,
} from '../../protocol/page-assets.js';
import {
  pageStylesheetRegistration,
  type PageStylesheetName,
} from './page-stylesheets.js';

export type { AssetTags, InlineStyleTag };
export { emptyAssetTags };

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

/** Dev URL for the shared sheet. Vite serves it as CSS for a stylesheet link. */
export const shellStylesheetDev = '/src/web/ui/styles/shell.scss';

/** Manifest key for the shared sheet, which is its own client build input. */
const shellStylesheetSource = 'src/web/ui/styles/shell.scss';

/** Vite client runtime: HMR / full-reload for shell SCSS even without islands. */
const viteClientDev = '/@vite/client';

/** Manifest key for the browser hydrate entry. */
const hydrateEntrySource = 'src/web/ui/runtime/island/hydrate.tsx';

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
    inlineStyles: [],
    scripts: [
      // Sets window.$RefreshReg$ before any island module evaluates.
      '/@id/@vitejs/plugin-react/preamble',
      viteClientDev,
      '/src/web/ui/runtime/island/hydrate.tsx',
    ],
  };
}

/**
 * Dev tags when the page has no islands.
 *
 * Still loads `/@vite/client` so shell SCSS edits trigger Vite reload
 * without a separate CSS watcher or BrowserSync.
 *
 * @returns {AssetTags} Shell stylesheet plus the Vite client only.
 */
export function developmentShellOnlyAssetTags(): AssetTags {
  return {
    stylesheets: [shellStylesheetDev],
    inlineStyles: [],
    scripts: [viteClientDev],
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
    inlineStyles: [],
    scripts: scripts.map((file) => `/${file}`),
  };
}

/**
 * Resolves a CSS-only Vite entry from the production manifest.
 *
 * A CSS-only entry stores the path on `file`. An entry that also emits a
 * script stores it on `css`. The script is not linked.
 *
 * @param {ClientManifest} manifest - Vite client manifest.
 * @param {string} source - Manifest key (e.g. `src/web/ui/styles/shell.scss`).
 * @param {string} label - Name used in the missing-chunk error.
 * @returns {string} Root-relative stylesheet URL.
 * @throws {Error} When the chunk is missing.
 */
function stylesheetFromManifestEntry(
  manifest: ClientManifest,
  source: string,
  label: string,
): string {
  const chunk = manifest[source];
  const file =
    chunk?.css?.[0] ?? (chunk?.file.endsWith('.css') ? chunk.file : undefined);

  if (!file) {
    throw new Error(`Client manifest is missing the ${label} stylesheet.`);
  }

  return `/${file}`;
}

/**
 * Returns the shared stylesheet URL from a production manifest.
 *
 * The shell is its own build input, so its CSS is not on the hydrate chunk.
 *
 * @param {ClientManifest} manifest - Vite client manifest.
 * @returns {string} Root-relative stylesheet URL.
 * @throws {Error} When the shell chunk is missing.
 */
export function shellStylesheetFromManifest(manifest: ClientManifest): string {
  return stylesheetFromManifestEntry(manifest, shellStylesheetSource, 'shell');
}

/**
 * Returns an opt-in page stylesheet URL from a production manifest.
 *
 * @param {ClientManifest} manifest - Vite client manifest.
 * @param {PageStylesheetName} name - Registered page stylesheet id.
 * @returns {string} Root-relative stylesheet URL.
 * @throws {Error} When the stylesheet chunk is missing.
 */
export function pageStylesheetFromManifest(
  manifest: ClientManifest,
  name: PageStylesheetName,
): string {
  const { source } = pageStylesheetRegistration(name);
  return stylesheetFromManifestEntry(manifest, source, name);
}

/**
 * Dev and production hrefs for the page stylesheets a render opted into.
 *
 * Sibling sheets are always `<link>`s (not inlined into the shell budget).
 *
 * @param {readonly PageStylesheetName[]} names - Sheets for this page.
 * @param {{ development: boolean; manifest?: ClientManifest }} source - Asset source.
 * @returns {string[]} Root-relative or Vite-dev stylesheet URLs.
 */
export function pageStylesheetHrefs(
  names: readonly PageStylesheetName[],
  source: { development: boolean; manifest?: ClientManifest },
): string[] {
  if (names.length === 0) {
    return [];
  }

  if (source.development) {
    return names.map((name) => pageStylesheetRegistration(name).devUrl);
  }

  if (!source.manifest) {
    throw new Error('Production pages need the client manifest.');
  }

  return names.map((name) =>
    pageStylesheetFromManifest(source.manifest!, name),
  );
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
