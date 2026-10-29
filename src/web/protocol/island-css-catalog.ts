/**
 * Data-only island CSS registration for SSR inlining.
 *
 * Host asset-delivery and the UI island registry both read this map. Dynamic
 * `import()` loaders for hydrate live only under `ui/runtime/island/registry`.
 */

/**
 * Dev-only Vite URL for an island CSS module, when the island has one.
 */
export type IslandCssModulePath = `/src/web/ui/islands/${string}.module.scss`;

/**
 * Optional CSS module path per product island name.
 *
 * Omit an entry (or set undefined) when the island has no module stylesheet.
 */
export const islandCssCatalog = {
  'mobile-navigation':
    '/src/web/ui/islands/mobile-navigation.module.scss' satisfies IslandCssModulePath,
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
 * @returns {string} Manifest key under `src/web/ui/islands/`.
 */
export function islandManifestSourceKey(name: IslandName): string {
  return `src/web/ui/islands/${name}.tsx`;
}
