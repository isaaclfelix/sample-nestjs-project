/**
 * Stylesheets and module scripts the document shell should emit.
 *
 * Empty lists mean the page ships no client assets. Island chunks are added
 * later and are never listed until a page actually renders an island.
 */
export interface AssetTags {
  stylesheets: string[];
  scripts: string[];
}

/** No client JavaScript and no stylesheets. */
export const emptyAssetTags: AssetTags = {
  stylesheets: [],
  scripts: [],
};
