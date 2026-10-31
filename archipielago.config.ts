/**
 * Host Archipielago configuration for this Nest sample.
 *
 * Sync and scaffold read this file from the repo root. Engines consume the
 * injected islands manifest and path getters — not this module directly.
 *
 * - `auto` — derive the manifest from conventional folders (`pnpm islands:sync`).
 * - `manual` — you own the manifest; sync refuses to write; scaffold warns.
 *
 * Path roots stay Nest-sample defaults (`ArchipielagoPaths`) until a second
 * host needs overrides (Phase 3). VCS for the generated manifest is a host
 * choice (this sample gitignores it).
 *
 * @see docs/adr/0030-archipielago-host-config.md
 */
import type { ArchipielagoUserConfig } from './src/archipielago/core/config.js';

const config: ArchipielagoUserConfig = {
  islands: {
    registration: 'auto',
  },
};

export default config;
