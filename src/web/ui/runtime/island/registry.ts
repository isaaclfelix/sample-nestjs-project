import type { ComponentType } from 'react';
import {
  islandCssCatalog,
  islandCssModuleUrl,
  isIslandName,
  type IslandName,
} from '@protocol/island-css-catalog';

/**
 * Default export of a client island module.
 *
 * The hydrate runtime renders this component inside the server-rendered marker.
 */
export interface IslandModule {
  default: ComponentType<Record<string, unknown>>;
}

/**
 * Loads the mobile-navigation island chunk.
 *
 * @returns {Promise<IslandModule>} The mobile-navigation module.
 */
function loadMobileNavigationIsland(): Promise<IslandModule> {
  // Concrete implementation file (not the thin barrel) — same path shape as
  // islandManifestSourceKey / islandEntryRelPath in protocol.
  return import('@ui/islands/mobile-navigation/mobile-navigation') as Promise<IslandModule>;
}

/**
 * Loads the login-form island chunk.
 *
 * @returns {Promise<IslandModule>} The login-form module.
 */
function loadLoginFormIsland(): Promise<IslandModule> {
  return import('@ui/islands/login-form/login-form') as Promise<IslandModule>;
}

/**
 * Loads the register-form island chunk.
 *
 * @returns {Promise<IslandModule>} The register-form module.
 */
function loadRegisterFormIsland(): Promise<IslandModule> {
  return import('@ui/islands/register-form/register-form') as Promise<IslandModule>;
}

/**
 * Loads the logout-button island chunk.
 *
 * @returns {Promise<IslandModule>} The logout-button module.
 */
function loadLogoutButtonIsland(): Promise<IslandModule> {
  return import('@ui/islands/logout-button/logout-button') as Promise<IslandModule>;
}

/**
 * One registered island: lazy client loader plus optional module CSS path for
 * development SSR inlining.
 */
export interface IslandRegistration {
  load: () => Promise<IslandModule>;
  /**
   * Dev-only: Vite URL for the island's CSS module.
   * Prefer {@link islandCssCatalog} in protocol; scaffold may still set this.
   */
  cssModulePath?: string;
}

/**
 * Island name to a lazy loader (and optional CSS module path for dev SSR).
 *
 * Each `load` is a dynamic `import()` so Vite emits a separate chunk. CSS
 * paths are sourced from {@link islandCssCatalog} (host-readable protocol).
 */
export const islandRegistry = {
  'mobile-navigation': {
    load: loadMobileNavigationIsland,
    cssModulePath: islandCssCatalog['mobile-navigation'],
  },
  'login-form': {
    load: loadLoginFormIsland,
    cssModulePath: islandCssCatalog['login-form'],
  },
  'register-form': {
    load: loadRegisterFormIsland,
    cssModulePath: islandCssCatalog['register-form'],
  },
  'logout-button': {
    load: loadLogoutButtonIsland,
    cssModulePath: islandCssCatalog['logout-button'],
  },
} as const satisfies Record<IslandName, IslandRegistration>;

/** Lazy loaders only — hydrate entry uses this shape. */
export const islandLoaders = {
  'mobile-navigation': loadMobileNavigationIsland,
  'login-form': loadLoginFormIsland,
  'register-form': loadRegisterFormIsland,
  'logout-button': loadLogoutButtonIsland,
} as const;

export type { IslandName };
export { isIslandName, islandCssModuleUrl };
