/**
 * Host-safe island registration API.
 *
 * The `islands` table is generated into the Nest app's
 * `islands.generated.ts` by `pnpm islands:sync` from product island folders.
 * Path helpers and type guards live here so sync never rewrites application API.
 *
 * Phase 1: core still imports the app-generated map in-repo. Package extraction
 * will inject the table instead of importing the sample path.
 */

import { islands } from '../../web/protocol/islands.generated.js';
import { getArchipielagoPaths } from './paths.js';

export { islands };

/**
 * Dev-only Vite URL for an island CSS module, when the island has one.
 */
export type IslandCssModulePath = `/${string}/${string}/${string}.module.scss`;

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

/** Names that have a client island chunk (table keys). */
export type IslandName = keyof typeof islands;

/**
 * Reports whether a marker name has a registered island.
 *
 * @param {string} name - Value of `data-island`.
 * @returns {boolean} True when the name is a key of {@link islands}.
 */
export function isIslandName(name: string): name is IslandName {
  return Object.prototype.hasOwnProperty.call(islands, name);
}

/**
 * Returns the Vite-dev CSS module URL for an island, when it has a module sheet.
 *
 * @param {IslandName} name - Registered island name.
 * @returns {string | undefined} Absolute-from-root Vite URL, or undefined.
 */
export function islandCssModuleUrl(name: IslandName): string | undefined {
  return islands[name].hasCssModule ? islandCssModulePath(name) : undefined;
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
