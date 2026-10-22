import { renderToString } from 'react-dom/server';
import type { AssetTags } from './asset-tags.js';
import { Document } from './document.js';
import { IslandNamesContext } from './islands/island.js';
import { HomePage } from './pages/home-page.js';
import type { HomePageProps, WebPageName } from './pages/home-page.props.js';

const pages = {
  home: HomePage,
} as const;

/**
 * Renders a named page to an HTML document string.
 *
 * Called by the Nest view service. The page map is the only place that
 * imports page components, so controllers stay free of TSX.
 *
 * @param {WebPageName} page - Key in the page map.
 * @param {HomePageProps} props - Props for that page.
 * @param {(islandNames: string[]) => AssetTags} createAssets - Builds script tags from the islands this render used.
 * @returns {Promise<string>} Document string starting with a doctype.
 */
export async function render(
  page: WebPageName,
  props: HomePageProps,
  createAssets: (islandNames: string[]) => AssetTags,
): Promise<string> {
  const Page = pages[page];
  const islandNames = new Set<string>();

  // First pass records island names. Asset URLs depend on that set.
  renderToString(
    <IslandNamesContext.Provider value={islandNames}>
      <Page {...props} />
    </IslandNamesContext.Provider>,
  );

  const assets = createAssets([...islandNames]);
  const html = renderToString(
    <Document assets={assets}>
      <Page {...props} />
    </Document>,
  );

  return `<!DOCTYPE html>${html}`;
}
