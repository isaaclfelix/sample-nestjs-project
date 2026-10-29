/**
 * Data-only island CSS registration for SSR inlining.
 *
 * Host asset-delivery and the UI island registry both read this map. Dynamic
 * `import()` loaders for hydrate live only under `ui/runtime/island/registry`.
 * Entry and CSS paths use the per-component folder layout ([ADR-0025](../../../docs/adr/0025-per-component-folders.md)).
 */

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

/**
 * Optional CSS module path per product island name.
 *
 * Omit an entry (or set undefined) when the island has no module stylesheet.
 */
export const islandCssCatalog = {
  'mobile-navigation': islandCssModulePath('mobile-navigation'),
  'login-form': undefined,
  'register-form': undefined,
  'logout-button': undefined,
} as const satisfies Record<string, IslandCssModulePath | undefined>;

/** Names that have a client island chunk (catalog keys). */
export type IslandName = keyof typeof islandCssCatalog;

/**
 * Reports whether a marker name has a registered island.
 *
 * @param {string} name - Value of `data-island`.
 * @returns {boolean} True when the name is a key of {@link islandCssCatalog}.
 */
export function isIslandName(name: string): name is IslandName {
  return Object.prototype.hasOwnProperty.call(islandCssCatalog, name);
}

/**
 * Returns the Vite-dev CSS module URL for an island, when registered.
 *
 * @param {IslandName} name - Registered island name.
 * @returns {string | undefined} Absolute-from-root Vite URL, or undefined.
 */
export function islandCssModuleUrl(name: IslandName): string | undefined {
  return islandCssCatalog[name];
}

/**
 * Vite client-manifest source key for an island's TSX entry.
 *
 * @param {IslandName} name - Registered island name.
 * @returns {string} Manifest key under `src/web/ui/islands/<name>/`.
 */
export function islandManifestSourceKey(name: IslandName): string {
  return islandEntryRelPath(name);
}
