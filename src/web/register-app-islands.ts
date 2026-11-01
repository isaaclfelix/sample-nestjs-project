import { registerIslands } from '../archipielago/core/islands.js';
import { registerAppPageStylesheets } from './page-stylesheets.js';
import { islands } from './protocol/islands.generated.js';

/**
 * Injects this app's generated islands manifest into Archipielago.
 *
 * Product islands live under `ui/islands/`; `pnpm islands:sync` writes
 * `protocol/islands.generated.ts`. Nest never reads that file for HTML
 * responses — only Archipielago engines use the injected manifest while
 * building documents and hydrating. Also registers opt-in page stylesheets.
 * The Vite island module glob is registered from the hydrate entry (and Vitest
 * setup), not here — Nest must not compile that Vite-only module.
 *
 * @returns {void}
 */
export function registerAppIslands(): void {
  registerIslands(islands);
  registerAppPageStylesheets();
}
