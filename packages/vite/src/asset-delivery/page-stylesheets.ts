/**
 * Optional design-system stylesheets a page can opt into (not the shell).
 *
 * Hosts register sheets via {@link setPageStylesheetRegistry}. Pages pass the
 * sheet ids they need into `createPageAssets`; that helper emits head `<link>`
 * tags for those sheets only.
 */

/**
 * Source path and Vite-dev URL for one opt-in page stylesheet.
 */
export interface PageStylesheetRegistration {
  /** Manifest key / Vite client input path. */
  source: string;
  /** Absolute-from-root URL Vite serves in development. */
  devUrl: string;
}

/**
 * Registered stylesheet id (host-defined; e.g. `forms`).
 */
export type PageStylesheetName = string;

let pageStylesheetRegistryState: Record<string, PageStylesheetRegistration> =
  {};

/**
 * Replaces the opt-in page stylesheet registry; pass `{}` or omit to clear.
 *
 * Call from host bootstrap after path roots are known. Engines read this map
 * when building asset tags; they do not own product sheet names.
 *
 * @param {Record<string, PageStylesheetRegistration>} registry - Sheet id → paths.
 * @returns {void}
 */
export function setPageStylesheetRegistry(
  registry: Record<string, PageStylesheetRegistration>,
): void {
  pageStylesheetRegistryState = { ...registry };
}

/**
 * Returns the active opt-in page stylesheet registry.
 *
 * @returns {Readonly<Record<string, PageStylesheetRegistration>>} Registry.
 */
export function pageStylesheetRegistry(): Readonly<
  Record<string, PageStylesheetRegistration>
> {
  return pageStylesheetRegistryState;
}

/**
 * Reports whether a name is a registered page stylesheet.
 *
 * @param {string} name - Candidate stylesheet id.
 * @returns {boolean} True when the name is registered.
 */
export function isPageStylesheetName(name: string): name is PageStylesheetName {
  return Object.prototype.hasOwnProperty.call(
    pageStylesheetRegistryState,
    name,
  );
}

/**
 * Returns the registration for a page stylesheet.
 *
 * @param {PageStylesheetName} name - Registered stylesheet id.
 * @returns {PageStylesheetRegistration} Source path and dev URL.
 * @throws {Error} When the name is not registered.
 */
export function pageStylesheetRegistration(
  name: PageStylesheetName,
): PageStylesheetRegistration {
  const registration = pageStylesheetRegistryState[name];
  if (registration === undefined) {
    throw new Error(`Unknown page stylesheet "${name}"`);
  }
  return registration;
}
