/**
 * Host Archipielago configuration for this Nest sample.
 *
 * Sync and scaffold read this file from the repo root. Engines consume the
 * injected islands table and path getters — not this module directly.
 *
 * - `auto` — derive the table from conventional folders (`pnpm islands:sync`).
 * - `manual` — you own the table file; sync refuses to write; scaffold warns.
 *
 * Changing `paths.islandsGeneratedRel` also requires updating the static
 * import in `src/web/register-app-islands.ts` (and the hydrate entry path).
 * VCS for the generated file is a host choice (this sample gitignores it).
 *
 * @see docs/adr/0030-archipielago-host-config.md
 */
import type { ArchipielagoUserConfig } from './src/archipielago/core/config.js';

const config: ArchipielagoUserConfig = {
  islands: {
    registration: 'auto',
  },
  paths: {
    islandsDirRel: 'src/web/ui/islands',
    islandsGeneratedRel: 'src/web/protocol/islands.generated.ts',
  },
};

export default config;
