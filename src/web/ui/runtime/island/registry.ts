import { islands, isIslandName, type IslandName } from '@protocol/islands';
import {
  assertIslandLoadersComplete,
  buildIslandLoaders,
} from './island-loaders';
import type { IslandModule } from './island-module';

export type { IslandModule };

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
 * Island name to a lazy loader so Vite emits a separate chunk per island.
 *
 * Built from the filtered glob, keyed by protocol {@link islands} names.
 */
export const islandLoaders = buildIslandLoaders(
  islandModules,
  isIslandName,
) as { [K in IslandName]: () => Promise<IslandModule> };

assertIslandLoadersComplete(
  Object.keys(islands) as IslandName[],
  islandLoaders,
);

export type { IslandName };
export { isIslandName };
