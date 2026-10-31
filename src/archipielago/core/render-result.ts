import type { PageAssets } from './page-assets.js';

/**
 * Nest-free result of rendering one HTML document.
 *
 * `html` is a full document including the doctype. `assets` mirrors the bag
 * already embedded into that document (tags + island CSS) so hosts can inspect
 * or log without scraping HTML. A later host may assemble documents differently;
 * for Phase 1 the Nest adapter returns `html` only.
 */
export interface RenderResult {
  /** Full HTML document string starting with `<!DOCTYPE html>`. */
  html: string;
  /** Asset bag used while composing the document. */
  assets: PageAssets;
}
