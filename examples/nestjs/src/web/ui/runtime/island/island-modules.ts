import { setIslandModules } from '@archipielago/react/runtime/island/registry';
import type { IslandModule } from '@archipielago/react/runtime/island/island-module';

/**
 * Vite glob of product island TSX under `web/ui/islands/` (lazy; never eager).
 *
 * Negative patterns drop Storybook and colocated specs. Loaders then keep only
 * `<name>/<name>.tsx` keys that appear in the injected islands manifest.
 * Must live in a Vite-owned product file so the relative glob resolves here.
 */
const islandModules = import.meta.glob([
  '../../islands/*/*.tsx',
  '!**/*.stories.tsx',
  '!**/*.spec.tsx',
]) as Record<string, () => Promise<IslandModule>>;

/**
 * Injects this app's island module glob into Archipielago's loader registry.
 *
 * Call from process bootstrap and from the browser hydrate entry (before
 * loaders are first resolved).
 *
 * @returns {void}
 */
export function registerAppIslandModules(): void {
  setIslandModules(islandModules);
}

registerAppIslandModules();
