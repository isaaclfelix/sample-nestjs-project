import { emptyAssetTags } from '../../src/archipielago/core/page-assets.js';
import type { RenderResult } from '../../src/archipielago/core/render-result.js';

/**
 * Tiny stub for page-loader unit tests that exercise the default dynamic import.
 *
 * @returns {Promise<RenderResult>} Minimal HTML document result.
 */
export async function render(): Promise<RenderResult> {
  return {
    html: '<!DOCTYPE html><p>stub</p>',
    assets: { tags: emptyAssetTags, islandCss: {} },
  };
}
