/**
 * Host-facing Archipielago configuration (islands registration mode).
 *
 * Tools load `archipielago.config.ts` from the repo root via
 * {@link loadAndApplyArchipielagoConfig}. Engines keep using
 * {@link getArchipielagoPaths} / injected islands; they do not branch on mode.
 *
 * Path roots stay Nest-sample defaults in {@link getArchipielagoPaths} until a
 * second host needs overrides (Phase 3) — see ADR-0030.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  defaultArchipielagoPaths,
  getArchipielagoPaths,
  setArchipielagoPaths,
  type ArchipielagoPaths,
} from './paths.js';

/**
 * How the host maintains the islands manifest that `registerIslands` injects.
 *
 * Engines always consume that injected manifest; they do not branch on mode.
 *
 * - `auto` — derive the manifest from conventional folders (`islands:sync` may
 *   write it; scaffold runs sync).
 * - `manual` — host owns the manifest; sync refuses to write; scaffold warns
 *   with the entry to add.
 *
 * Folder layout stays `ui/islands/<name>/<name>.tsx` either way ([ADR-0025]).
 */
export type IslandsRegistration = 'auto' | 'manual';

/**
 * Optional host config file shape (`archipielago.config.ts` default export).
 *
 * Path overrides are not part of this surface yet (deferred to Phase 3).
 */
export interface ArchipielagoUserConfig {
  islands?: {
    /**
     * How the host maintains the islands manifest. Defaults to `auto`.
     */
    registration?: IslandsRegistration;
  };
}

/**
 * Resolved runtime config after defaults + user file / test overrides.
 */
export interface ArchipielagoResolvedConfig {
  paths: ArchipielagoPaths;
  islandsRegistration: IslandsRegistration;
}

const defaultRegistration: IslandsRegistration = 'auto';

let islandsRegistration: IslandsRegistration = defaultRegistration;

/**
 * Returns the active islands registration mode.
 *
 * @returns {IslandsRegistration} `auto` (sync) or `manual` (host-owned manifest).
 */
export function getIslandsRegistration(): IslandsRegistration {
  return islandsRegistration;
}

/**
 * Returns paths plus registration mode for tools and diagnostics.
 *
 * Paths always come from {@link getArchipielagoPaths} (sample defaults or
 * in-process test overrides via {@link setArchipielagoPaths}).
 *
 * @returns {ArchipielagoResolvedConfig} Current resolved configuration.
 */
export function getArchipielagoConfig(): ArchipielagoResolvedConfig {
  return {
    paths: getArchipielagoPaths(),
    islandsRegistration,
  };
}

/**
 * Restores path defaults and `auto` registration.
 *
 * @returns {void}
 */
export function resetArchipielagoConfig(): void {
  setArchipielagoPaths(undefined);
  islandsRegistration = defaultRegistration;
}

/**
 * Applies a user config object (registration mode only).
 *
 * Pass `undefined` to restore path defaults and `auto` registration.
 * Does not clear unspecified fields when a partial config is passed — call
 * {@link resetArchipielagoConfig} first when loading a fresh host file.
 *
 * @param {ArchipielagoUserConfig | undefined} config - Host overrides, or clear.
 * @returns {void}
 * @throws {Error} When a legacy `paths` key is present on the config object.
 */
export function applyArchipielagoUserConfig(
  config: ArchipielagoUserConfig | undefined,
): void {
  if (config === undefined) {
    resetArchipielagoConfig();
    return;
  }

  // Reject deferred path overrides so hosts do not think config relocates roots.
  if (
    Object.prototype.hasOwnProperty.call(config, 'paths') &&
    (config as { paths?: unknown }).paths !== undefined
  ) {
    throw new Error(
      'archipielago.config.ts: `paths` overrides are not supported yet ' +
        '(deferred until Phase 3 / a second host). Use Nest-sample defaults in ' +
        'ArchipielagoPaths, or setArchipielagoPaths in tests only. See ADR-0030.',
    );
  }

  if (config.islands?.registration !== undefined) {
    islandsRegistration = config.islands.registration;
  }
}

/**
 * Loads `archipielago.config.ts` from `rootDir` when present and applies it.
 *
 * Always resets to defaults first, then merges the file when it exists. Call
 * from sync/scaffold CLI before reading paths/mode.
 *
 * @param {string} rootDir - Repository root that may contain the config file.
 * @returns {Promise<ArchipielagoResolvedConfig>} Config after load/apply.
 */
export async function loadAndApplyArchipielagoConfig(
  rootDir: string,
): Promise<ArchipielagoResolvedConfig> {
  resetArchipielagoConfig();

  const configPath = join(rootDir, 'archipielago.config.ts');
  if (!existsSync(configPath)) {
    return getArchipielagoConfig();
  }

  const mod: { default?: ArchipielagoUserConfig } & ArchipielagoUserConfig =
    await import(pathToFileURL(configPath).href);
  const user = mod.default ?? mod;
  applyArchipielagoUserConfig(user);
  return getArchipielagoConfig();
}

/**
 * Builds the manual-mode scaffold warning for a new island entry.
 *
 * @param {string} name - Island folder / registry name.
 * @param {boolean} hasCssModule - Whether `<name>.module.scss` was written.
 * @param {string} manifestRel - Repo-relative islands manifest path from defaults.
 * @returns {string} Multi-line warning for authors.
 */
export function manualIslandManifestWarning(
  name: string,
  hasCssModule: boolean,
  manifestRel: string,
): string {
  return [
    `islands.registration=manual: add this entry to ${manifestRel} (sync will not run):`,
    ``,
    `  '${name}': { hasCssModule: ${String(hasCssModule)} },`,
  ].join('\n');
}

/**
 * Defaults used when no host config file is present.
 *
 * @returns {ArchipielagoResolvedConfig} Sample-aligned defaults.
 */
export function defaultArchipielagoResolvedConfig(): ArchipielagoResolvedConfig {
  return {
    paths: { ...defaultArchipielagoPaths },
    islandsRegistration: defaultRegistration,
  };
}
