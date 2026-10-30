/**
 * Host-safe island registration API.
 *
 * The `islands` table is generated into `islands.generated.ts` by
 * `pnpm islands:sync` from `ui/islands/<name>/<name>.tsx` ([ADR-0028](../../../docs/adr/0028-island-filesystem-manifest.md)).
 * Path helpers and type guards live here so sync never rewrites application API.
 */

import { islands } from './islands.generated.js';

export { islands };

/**
 * Dev-only Vite URL for an island CSS module, when the island has one.
 *
 * Nested under `ui/islands/<name>/<name>.module.scss`.
 */
export type IslandCssModulePath =
  `/src/web/ui/islands/${string}/${string}.module.scss`;

/**
 * Returns the Vite client-manifest source key for an island's TSX entry.
 *
 * Concrete implementation file (not the thin barrel), so registry dynamic
 * imports and host asset lookup share one path shape.
 *
 * @param {string} name - Island folder / registry name (kebab-case).
 * @returns {string} Manifest key under `src/web/ui/islands/<name>/`.
 */
export function islandEntryRelPath(name: string): string {
  return `src/web/ui/islands/${name}/${name}.tsx`;
}

/**
 * Returns the Vite-dev URL for an island's CSS module.
 *
 * @param {string} name - Island folder / registry name (kebab-case).
 * @returns {IslandCssModulePath} Absolute-from-root Vite URL.
 */
export function islandCssModulePath(name: string): IslandCssModulePath {
  return `/src/web/ui/islands/${name}/${name}.module.scss`;
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
 * @returns {string} Manifest key under `src/web/ui/islands/`.
 */
export function islandManifestSourceKey(name: IslandName): string {
  return islandEntryRelPath(name);
}
