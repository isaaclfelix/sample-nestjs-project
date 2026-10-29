import type { ComponentType } from 'react';

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
  return import('../islands/mobile-navigation.js') as Promise<IslandModule>;
}

/**
 * Loads the login-form island chunk.
 *
 * @returns {Promise<IslandModule>} The login-form module.
 */
function loadLoginFormIsland(): Promise<IslandModule> {
  return import('../islands/login-form.js') as Promise<IslandModule>;
}

/**
 * Loads the register-form island chunk.
 *
 * @returns {Promise<IslandModule>} The register-form module.
 */
function loadRegisterFormIsland(): Promise<IslandModule> {
  return import('../islands/register-form.js') as Promise<IslandModule>;
}

/**
 * Loads the logout-button island chunk.
 *
 * @returns {Promise<IslandModule>} The logout-button module.
 */
function loadLogoutButtonIsland(): Promise<IslandModule> {
  return import('../islands/logout-button.js') as Promise<IslandModule>;
}
/**
 * One registered island: lazy client loader plus optional module CSS path for
 * development SSR inlining.
 */
export interface IslandRegistration {
  load: () => Promise<IslandModule>;
  /**
   * Dev-only: Vite URL for the island's CSS module (e.g. `/src/web/islands/foo.module.scss`).
   * Production resolves CSS from the client manifest instead.
   */
  cssModulePath?: string;
}

/**
 * Island name to a lazy loader (and optional CSS module path for dev SSR).
 *
 * Each `load` is a dynamic `import()` so Vite emits a separate chunk. The
 * client entry imports this object only. It must not statically import an
 * island component, or every island would ship in the entry bundle.
 */
export const islandRegistry = {
  'mobile-navigation': {
    load: loadMobileNavigationIsland,
    cssModulePath: '/src/web/islands/mobile-navigation.module.scss',
  },
  'login-form': {
    load: loadLoginFormIsland,
  },
  'register-form': {
    load: loadRegisterFormIsland,
  },
  'logout-button': {
    load: loadLogoutButtonIsland,
  },
} as const satisfies Record<string, IslandRegistration>;

/** Lazy loaders only — hydrate entry uses this shape. */
export const islandLoaders = {
  'mobile-navigation': loadMobileNavigationIsland,
  'login-form': loadLoginFormIsland,
  'register-form': loadRegisterFormIsland,
  'logout-button': loadLogoutButtonIsland,
} as const;

/** Names registered in `islandRegistry`. */
export type IslandName = keyof typeof islandRegistry;

/**
 * Reports whether a marker name has a client chunk.
 *
 * @param {string} name - Value of `data-island`.
 * @returns {boolean} True when the name is a key of `islandRegistry`.
 */
export function isIslandName(name: string): name is IslandName {
  return Object.prototype.hasOwnProperty.call(islandRegistry, name);
}

/**
 * Returns the Vite-dev CSS module URL for an island, when registered.
 *
 * @param {IslandName} name - Registered island name.
 * @returns {string | undefined} Absolute-from-root Vite URL, or undefined.
 */
export function islandCssModuleUrl(name: IslandName): string | undefined {
  // `as const` omits optional keys; widen to the registration shape for access.
  return (islandRegistry[name] as IslandRegistration).cssModulePath;
}
