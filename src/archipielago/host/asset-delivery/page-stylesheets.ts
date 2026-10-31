import { getArchipielagoPaths } from '../../core/paths.js';

/**
 * Optional design-system stylesheets a page can opt into (not the shell).
 *
 * Each name is a Vite client build input under product `ui/styles/`. Pages list
 * the sheets they need in {@link pageStylesheetsByPage}; `createPageAssets`
 * emits head `<link>` tags for those sheets only.
 */
export type PageStylesheetName = 'forms';

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
 * Returns the registry of opt-in page stylesheets from active path config.
 *
 * Grow this when adding another sibling sheet (e.g. tables). Do not put
 * shell or island module CSS here.
 *
 * @returns {Record<PageStylesheetName, PageStylesheetRegistration>} Registry.
 */
export function pageStylesheetRegistry(): Record<
  PageStylesheetName,
  PageStylesheetRegistration
> {
  const paths = getArchipielagoPaths();
  return {
    forms: {
      source: paths.formsStylesheetSource,
      devUrl: paths.formsStylesheetDev,
    },
  };
}

/**
 * Stylesheets each named page opts into.
 *
 * Empty means shell (+ island CSS) only. Login/register opt into `forms`.
 * Keys stay aligned with `WebPageName` as pages are added.
 */
export const pageStylesheetsByPage = {
  home: [] as const satisfies readonly PageStylesheetName[],
  login: ['forms'] as const satisfies readonly PageStylesheetName[],
  register: ['forms'] as const satisfies readonly PageStylesheetName[],
} as const;

/**
 * Reports whether a name is a registered page stylesheet.
 *
 * @param {string} name - Candidate stylesheet id.
 * @returns {boolean} True when the name is a {@link PageStylesheetName}.
 */
export function isPageStylesheetName(name: string): name is PageStylesheetName {
  return Object.prototype.hasOwnProperty.call(pageStylesheetRegistry(), name);
}

/**
 * Returns the registration for a page stylesheet.
 *
 * @param {PageStylesheetName} name - Registered stylesheet id.
 * @returns {PageStylesheetRegistration} Source path and dev URL.
 */
export function pageStylesheetRegistration(
  name: PageStylesheetName,
): PageStylesheetRegistration {
  return pageStylesheetRegistry()[name];
}
