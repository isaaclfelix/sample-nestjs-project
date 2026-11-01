import type { PageStylesheetName } from '@archipielago/vite/asset-delivery/page-stylesheets.js';

/**
 * Configuration supplied by a Nest host.
 */
export interface ArchipielagoNestOptions {
  /**
   * Returns app-owned sibling stylesheet names for a page.
   *
   * The renderer calls this for every request unless the render call provides
   * an explicit stylesheet list.
   */
  getPageStylesheets?: (
    page: string,
  ) => readonly PageStylesheetName[] | undefined;
}

/**
 * Nest injection token for Archipielago host options.
 */
export const ARCHIPIELAGO_NEST_OPTIONS = Symbol('ARCHIPIELAGO_NEST_OPTIONS');
