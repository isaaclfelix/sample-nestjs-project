/**
 * Vitest setup: inject the sample app islands manifest before unit specs run.
 *
 * Archipielago engines read the manifest via registerIslands; Nest controllers
 * do not. Node and browser unit projects both need this before SSR/hydrate tests.
 * Also injects the Vite island module glob so registry loader specs resolve.
 *
 * Re-registers in `beforeEach` so package fixture specs that overwrite the
 * process-global manifest/modules (e.g. `@archipielago/react` hydrate tests)
 * cannot leak into later Nest product specs in the same worker.
 */
import { beforeEach } from 'vitest';
import { registerAppIslands } from '../src/web/register-app-islands.js';
import { registerAppIslandModules } from '../src/web/ui/runtime/island/island-modules.js';

registerAppIslands();
registerAppIslandModules();

beforeEach(() => {
  registerAppIslands();
  registerAppIslandModules();
});
