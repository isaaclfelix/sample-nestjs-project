import { registerIslands } from '../archipielago/core/islands.js';
import { islands } from './protocol/islands.generated.js';

/**
 * Injects this app's generated island table into Archipielago.
 *
 * Product islands live under `ui/islands/`; `pnpm islands:sync` writes
 * `protocol/islands.generated.ts`. Nest never reads that file for HTML
 * responses — only Archipielago engines use the injected table while
 * building documents and hydrating. Call from process bootstrap and from the
 * browser hydrate entry (before loaders are first resolved).
 *
 * @returns {void}
 */
export function registerAppIslands(): void {
  registerIslands(islands);
}
