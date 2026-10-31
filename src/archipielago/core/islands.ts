/**
 * Island registration API for Archipielago engines.
 *
 * The product app owns island folders and the gitignored generated manifest
 * (`pnpm islands:sync`). The app **injects** that manifest via
 * {@link registerIslands} at bootstrap (and in the browser hydrate entry).
 * Nest HTTP code never reads the manifest — only these engines use it while
 * building the HTML document and hydrating markers.
 */

import { getArchipielagoPaths } from './paths.js';

/**
 * One product island in the generated / injected manifest.
 */
export interface IslandRegistration {
  /** True when `<name>/<name>.module.scss` exists beside the TSX entry. */
  hasCssModule: boolean;
}

/**
 * Name → registration flags. Keys are kebab-case island folder names.
 */
export type IslandsTable = Readonly<Record<string, IslandRegistration>>;

/** Registered island names (manifest keys after {@link registerIslands}). */
export type IslandName = string;

let islandsTable: IslandsTable = {};

/**
 * Injects the app's islands manifest for SSR asset delivery and hydrate loaders.
 *
 * Call once at process bootstrap (and from the browser hydrate entry) before
 * rendering or hydrating. Pass `undefined` in tests to clear.
 *
 * @param {IslandsTable | undefined} table - Generated manifest, or clear.
 * @returns {void}
 */
export function registerIslands(table: IslandsTable | undefined): void {
  islandsTable = table === undefined ? {} : table;
}

/**
 * Returns the injected islands manifest.
 *
 * @returns {IslandsTable} Current registration map (empty until registered).
 */
export function getIslands(): IslandsTable {
  return islandsTable;
}

/**
 * Dev-only Vite URL for an island CSS module, when the island has one.
 */
export type IslandCssModulePath = string;

/**
 * Returns the Vite client-manifest source key for an island's TSX entry.
 *
 * Concrete implementation file (not the thin barrel), so registry dynamic
 * imports and host asset lookup share one path shape.
 *
 * @param {string} name - Island folder / registry name (kebab-case).
 * @returns {string} Manifest key under the configured islands directory.
 */
export function islandEntryRelPath(name: string): string {
  const { islandsDirRel } = getArchipielagoPaths();
  return `${islandsDirRel}/${name}/${name}.tsx`;
}

/**
 * Returns the Vite-dev URL for an island's CSS module.
 *
 * @param {string} name - Island folder / registry name (kebab-case).
 * @returns {IslandCssModulePath} Absolute-from-root Vite URL.
 */
export function islandCssModulePath(name: string): IslandCssModulePath {
  const { islandsDirDevPrefix } = getArchipielagoPaths();
  return `${islandsDirDevPrefix}/${name}/${name}.module.scss`;
}

/**
 * Reports whether a marker name has a registered island.
 *
 * @param {string} name - Value of `data-island`.
 * @returns {boolean} True when the name is a key of the injected manifest.
 */
export function isIslandName(name: string): name is IslandName {
  return Object.prototype.hasOwnProperty.call(islandsTable, name);
}

/**
 * Returns the Vite-dev CSS module URL for an island, when it has a module sheet.
 *
 * @param {IslandName} name - Registered island name.
 * @returns {string | undefined} Absolute-from-root Vite URL, or undefined.
 */
export function islandCssModuleUrl(name: IslandName): string | undefined {
  const entry = islandsTable[name];
  return entry?.hasCssModule === true ? islandCssModulePath(name) : undefined;
}

/**
 * Vite client-manifest source key for an island's TSX entry.
 *
 * @param {IslandName} name - Registered island name.
 * @returns {string} Manifest key under the islands directory.
 */
export function islandManifestSourceKey(name: IslandName): string {
  return islandEntryRelPath(name);
}
