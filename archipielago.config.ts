/**
 * Host Archipielago configuration for this Nest sample.
 *
 * Sync and scaffold read this file from the repo root. Engines consume the
 * injected islands table and path getters — not this module directly.
 *
 * - `filesystem` — folders are SoT; `pnpm islands:sync` writes the map.
 * - `manifest` — you own the map; sync refuses to write; scaffold warns.
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
    registration: 'filesystem',
  },
  paths: {
    islandsDirRel: 'src/web/ui/islands',
    islandsGeneratedRel: 'src/web/protocol/islands.generated.ts',
  },
};

export default config;
