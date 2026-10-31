/**
 * Vitest setup: inject the sample app islands manifest before unit specs run.
 *
 * Archipielago engines read the manifest via registerIslands; Nest controllers
 * do not. Node and browser unit projects both need this before SSR/hydrate tests.
 */
import { registerAppIslands } from '../src/web/register-app-islands.js';

registerAppIslands();
