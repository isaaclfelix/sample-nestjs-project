import type { IslandName } from '@protocol/islands';
import { islandNameFromGlobKey } from './island-glob-key';
import type { IslandModule } from './island-module';

/**
 * Builds lazy island loaders from a Vite glob map and a registration predicate.
 *
 * @param {Record<string, () => Promise<IslandModule>>} modules - Glob result.
 * @param {(name: string) => boolean} isRegistered - Protocol allowlist.
 * @returns {Partial<Record<IslandName, () => Promise<IslandModule>>>} Loaders for registered names only.
 */
export function buildIslandLoaders(
  modules: Record<string, () => Promise<IslandModule>>,
  isRegistered: (name: string) => boolean,
): Partial<Record<IslandName, () => Promise<IslandModule>>> {
  return Object.fromEntries(
    Object.entries(modules).flatMap(([key, load]) => {
      const name = islandNameFromGlobKey(key);
      if (name === undefined || !isRegistered(name)) {
        return [];
      }
      return [[name, load] as const];
    }),
  );
}

/**
 * Throws when the protocol table lists an island with no conventional loader.
 *
 * @param {readonly IslandName[]} names - Protocol island names.
 * @param {Partial<Record<IslandName, unknown>>} loaders - Built loader map.
 * @returns {void}
 * @throws {Error} When a name has no loader entry.
 */
export function assertIslandLoadersComplete(
  names: readonly IslandName[],
  loaders: Partial<Record<IslandName, unknown>>,
): void {
  for (const name of names) {
    if (loaders[name] === undefined) {
      throw new Error(
        `Island "${name}" is in protocol/islands but has no conventional loader chunk`,
      );
    }
  }
}
