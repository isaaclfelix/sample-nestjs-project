import type { ComponentType } from 'react';

/**
 * Default export of a client island module.
 *
 * The hydrate runtime renders this component inside the server-rendered marker.
 */
export interface IslandModule {
  default: ComponentType<Record<string, unknown>>;
}

/**
 * Loads the demo counter chunk.
 *
 * The cast matches `IslandModule` because decoded props are a plain JSON
 * object. The home page passes `{ start: number }`. Remove this loader with
 * the counter under TD-009.
 *
 * @returns {Promise<IslandModule>} The counter module.
 */
function loadCounterIsland(): Promise<IslandModule> {
  // Props are checked by the page that renders the island, not by this cast.
  return import('./counter.js') as Promise<IslandModule>;
}

/**
 * Loads the navigation island.
 *
 * @returns {Promise<IslandModule>} The navigation module.
 */
function loadNavigationIsland(): Promise<IslandModule> {
  return import('./navigation.js') as Promise<IslandModule>;
}

/**
 * One registered island: lazy client loader plus optional module CSS path for
 * development SSR inlining.
 */
export interface IslandRegistration {
  load: () => Promise<IslandModule>;
  /**
   * Dev-only: Vite URL for the island's CSS module (e.g. `/src/web/islands/foo.module.scss`).
   * Production resolves CSS from the client manifest instead.
   */
  cssModulePath?: string;
}

/**
 * Island name to a lazy loader (and optional CSS module path for dev SSR).
 *
 * Each `load` is a dynamic `import()` so Vite emits a separate chunk. The
 * client entry imports this object only. It must not statically import an
 * island component, or every island would ship in the entry bundle.
 */
export const islandRegistry = {
  counter: {
    load: loadCounterIsland,
    cssModulePath: '/src/web/islands/counter.module.scss',
  },
  navigation: {
    load: loadNavigationIsland,
    cssModulePath: '/src/web/islands/navigation.module.scss',
  },
} as const satisfies Record<string, IslandRegistration>;

/** Lazy loaders only — hydrate entry uses this shape. */
export const islandLoaders = {
  counter: loadCounterIsland,
  navigation: loadNavigationIsland,
} as const;

/** Names registered in `islandRegistry`. */
export type IslandName = keyof typeof islandRegistry;

/**
 * Reports whether a marker name has a client chunk.
 *
 * @param {string} name - Value of `data-island`.
 * @returns {boolean} True when the name is a key of `islandRegistry`.
 */
export function isIslandName(name: string): name is IslandName {
  return Object.prototype.hasOwnProperty.call(islandRegistry, name);
}

/**
 * Returns the Vite-dev CSS module URL for an island, when registered.
 *
 * @param {IslandName} name - Registered island name.
 * @returns {string | undefined} Absolute-from-root Vite URL, or undefined.
 */
export function islandCssModuleUrl(name: IslandName): string | undefined {
  return islandRegistry[name].cssModulePath;
}
