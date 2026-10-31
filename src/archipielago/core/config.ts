/**
 * Host-facing Archipielago configuration (registration mode + path overrides).
 *
 * Tools load `archipielago.config.ts` from the repo root via
 * {@link loadAndApplyArchipielagoConfig}. Engines keep using
 * {@link getArchipielagoPaths} / injected islands; they do not branch on mode.
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
 * How the host maintains the islands table.
 *
 * - `filesystem` — conventional folders are SoT; `islands:sync` writes the map.
 * - `manifest` — host owns the map file; sync refuses to write; scaffold warns.
 *
 * Folder layout stays `ui/islands/<name>/<name>.tsx` either way ([ADR-0025]).
 */
export type IslandsRegistration = 'filesystem' | 'manifest';

/**
 * Optional host config file shape (`archipielago.config.ts` default export).
 */
export interface ArchipielagoUserConfig {
  /** Partial path overrides merged onto defaults. */
  paths?: Partial<ArchipielagoPaths>;
  islands?: {
    /**
     * Source of truth for the islands table. Defaults to `filesystem`.
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

const defaultRegistration: IslandsRegistration = 'filesystem';

let islandsRegistration: IslandsRegistration = defaultRegistration;

/**
 * Returns the active islands registration mode.
 *
 * @returns {IslandsRegistration} `filesystem` (sync) or `manifest` (manual).
 */
export function getIslandsRegistration(): IslandsRegistration {
  return islandsRegistration;
}

/**
 * Returns paths plus registration mode for tools and diagnostics.
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
 * Restores path defaults and `filesystem` registration.
 *
 * @returns {void}
 */
export function resetArchipielagoConfig(): void {
  setArchipielagoPaths(undefined);
  islandsRegistration = defaultRegistration;
}

/**
 * Applies a user config object (path merges + registration).
 *
 * Pass `undefined` to restore path defaults and `filesystem` registration.
 * Does not clear unspecified fields when a partial config is passed — call
 * {@link resetArchipielagoConfig} first when loading a fresh host file.
 *
 * @param {ArchipielagoUserConfig | undefined} config - Host overrides, or clear.
 * @returns {void}
 */
export function applyArchipielagoUserConfig(
  config: ArchipielagoUserConfig | undefined,
): void {
  if (config === undefined) {
    resetArchipielagoConfig();
    return;
  }

  if (config.paths !== undefined) {
    setArchipielagoPaths(config.paths);
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
 * @param {string} manifestRel - Repo-relative manifest path from config.
 * @returns {string} Multi-line warning for authors.
 */
export function manualIslandManifestWarning(
  name: string,
  hasCssModule: boolean,
  manifestRel: string,
): string {
  return [
    `islands.registration=manifest: add this entry to ${manifestRel} (sync will not run):`,
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
