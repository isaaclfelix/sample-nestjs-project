import { registerIslands } from '@archipielago/core/islands';
import { hydrateIslands } from '@archipielago/react/runtime/island/hydrate';
import { islands } from '@protocol/islands.generated';
import './island-modules';

/**
 * Browser hydrate entry for this Nest sample app.
 *
 * Injects the generated islands manifest and island module glob, then hydrates
 * markers. Archipielago's hydrate helper stays free of app paths; Nest never
 * reads the manifest.
 */
registerIslands(islands);
await hydrateIslands();
