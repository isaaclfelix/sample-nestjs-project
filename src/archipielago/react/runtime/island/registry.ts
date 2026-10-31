import {
  getIslands,
  isIslandName,
  type IslandName,
} from '@archipielago/core/islands';
import {
  assertIslandLoadersComplete,
  buildIslandLoaders,
} from './island-loaders';
import type { IslandModule } from './island-module';

export type { IslandModule };
export type { IslandName };
export { isIslandName };

/**
 * Vite glob of product island TSX under `web/ui/islands/` (lazy; never eager).
 *
 * Negative patterns drop Storybook and colocated specs. Loaders then keep only
 * `<name>/<name>.tsx` keys that appear in the injected islands table.
 */
const islandModules = import.meta.glob([
  '../../../../web/ui/islands/*/*.tsx',
  '!**/*.stories.tsx',
  '!**/*.spec.tsx',
]) as Record<string, () => Promise<IslandModule>>;

let islandLoadersCache:
  Partial<Record<IslandName, () => Promise<IslandModule>>> | undefined;

/**
 * Returns lazy island loaders keyed by injected registration names.
 *
 * Builds once after {@link registerIslands} / app bootstrap. Safe to call from
 * hydrate after the app hydrate entry has registered the table (ESM import
 * hoisting must not build loaders at module evaluate time).
 *
 * @returns {Partial<Record<IslandName, () => Promise<IslandModule>>>} Loaders.
 * @throws {Error} When no islands have been registered yet.
 */
export function getIslandLoaders(): Partial<
  Record<IslandName, () => Promise<IslandModule>>
> {
  if (islandLoadersCache !== undefined) {
    return islandLoadersCache;
  }

  const islands = getIslands();
  const names = Object.keys(islands);

  if (names.length === 0) {
    throw new Error(
      'Island loaders require registerIslands() (app bootstrap / hydrate entry) before use',
    );
  }

  const loaders = buildIslandLoaders(islandModules, isIslandName);
  assertIslandLoadersComplete(names, loaders);
  islandLoadersCache = loaders;
  return loaders;
}

/**
 * Clears the loader cache (tests that re-register islands).
 *
 * @returns {void}
 */
export function resetIslandLoadersCache(): void {
  islandLoadersCache = undefined;
}
