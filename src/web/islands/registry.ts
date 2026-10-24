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
 * Island name to a lazy loader.
 *
 * Each value is a dynamic `import()` so Vite emits a separate chunk. The
 * client entry imports this object only. It must not statically import an
 * island component, or every island would ship in the entry bundle.
 */
export const islandLoaders = {
  counter: loadCounterIsland,
} as const;

/** Names registered in `islandLoaders`. */
export type IslandName = keyof typeof islandLoaders;

/**
 * Reports whether a marker name has a client chunk.
 *
 * @param {string} name - Value of `data-island`.
 * @returns {boolean} True when the name is a key of `islandLoaders`.
 */
export function isIslandName(name: string): name is IslandName {
  return Object.prototype.hasOwnProperty.call(islandLoaders, name);
}
