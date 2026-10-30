import type { IslandName } from './islands.js';

/** One `<style>` block to emit in the document head (e.g. inlined shell). */
export interface InlineStyleTag {
  id: string;
  css: string;
}

/**
 * Stylesheets, head inlines, and module scripts the document shell should emit.
 *
 * Empty lists mean the page ships no client assets of that kind.
 */
export interface AssetTags {
  stylesheets: string[];
  inlineStyles: InlineStyleTag[];
  scripts: string[];
}

/**
 * Document tags plus island CSS text for SSR sibling `<style>` tags.
 */
export interface PageAssets {
  tags: AssetTags;
  islandCss: Readonly<Partial<Record<IslandName, string>>>;
}

/** No client JavaScript and no stylesheets. */
export const emptyAssetTags: AssetTags = {
  stylesheets: [],
  inlineStyles: [],
  scripts: [],
};
