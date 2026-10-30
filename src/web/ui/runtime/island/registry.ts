import type { ComponentType } from 'react';
import { islands, isIslandName, type IslandName } from '@protocol/islands';

/**
 * Default export of a client island module.
 *
 * The hydrate runtime renders this component inside the server-rendered marker.
 */
export interface IslandModule {
  default: ComponentType<Record<string, unknown>>;
}

/**
 * Vite glob of island TSX under `ui/islands/` (lazy; never eager).
 *
 * Negative patterns drop Storybook and colocated specs. Loaders then keep only
 * `<name>/<name>.tsx` keys that appear in {@link islands}.
 */
const islandModules = import.meta.glob([
  '../../islands/*/*.tsx',
  '!**/*.stories.tsx',
  '!**/*.spec.tsx',
]) as Record<string, () => Promise<IslandModule>>;

/**
 * Derives the island registry name from a glob key when it matches convention.
 *
 * @param {string} key - Vite glob key (relative to this file).
 * @returns {string | undefined} Kebab island name, or undefined when not conventional.
 */
function islandNameFromGlobKey(key: string): string | undefined {
  const match = /\/islands\/([^/]+)\/([^/]+)\.tsx$/.exec(key);
  if (!match) {
    return undefined;
  }
  const [, folder, file] = match;
  if (folder === undefined || file === undefined || folder !== file) {
    return undefined;
  }
  return folder;
}

/**
 * Island name to a lazy loader so Vite emits a separate chunk per island.
 *
 * Built from the filtered glob, keyed by protocol {@link islands} names.
 */
export const islandLoaders = Object.fromEntries(
  Object.entries(islandModules).flatMap(([key, load]) => {
    const name = islandNameFromGlobKey(key);
    if (name === undefined || !isIslandName(name)) {
      return [];
    }
    return [[name, load] as const];
  }),
) as { [K in IslandName]: () => Promise<IslandModule> };

// Fail fast when disk/glob and the generated protocol table disagree.
for (const name of Object.keys(islands) as IslandName[]) {
  if (islandLoaders[name] === undefined) {
    throw new Error(
      `Island "${name}" is in protocol/islands but has no conventional loader chunk`,
    );
  }
}

export type { IslandName };
export { isIslandName };
