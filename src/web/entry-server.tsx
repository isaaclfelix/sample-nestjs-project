import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Document } from './document.js';
import { IslandCssContext, IslandNamesContext } from './islands/island.js';
import type { IslandName } from './islands/registry.js';
import type { PageAssets } from './page-assets.js';
import { HomePage } from './pages/home-page.js';
import { LoginPage } from './pages/login-page.js';
import type { PagePropsMap, WebPageName } from './pages/page-props.js';

const pages = {
  home: HomePage,
  login: LoginPage,
} as const satisfies {
  [K in WebPageName]: (props: PagePropsMap[K]) => ReactElement;
};

/**
 * Renders a named page to an HTML document string.
 *
 * Called by the Nest view service. The page map is the only place that
 * imports page components, so controllers stay free of TSX.
 *
 * Pass 1 collects island names. Pass 2 uses framework-built page assets
 * (shell link/inline + island CSS map) and emits sibling island `<style>` tags.
 *
 * @template {WebPageName} K - Page key in {@link PagePropsMap}.
 * @param {K} page - Key in the page map.
 * @param {PagePropsMap[K]} props - Props for that page.
 * @param {(islandNames: string[]) => PageAssets | Promise<PageAssets>} createAssets - Builds tags and island CSS from used islands.
 * @returns {Promise<string>} Document string starting with a doctype.
 */
export async function render<K extends WebPageName>(
  page: K,
  props: PagePropsMap[K],
  createAssets: (islandNames: string[]) => PageAssets | Promise<PageAssets>,
): Promise<string> {
  const Page = pages[page] as (props: PagePropsMap[K]) => ReactElement;
  const islandNames = new Set<string>();

  // First pass records island names. Asset URLs depend on that set.
  renderToString(
    <IslandNamesContext.Provider value={islandNames}>
      <Page {...props} />
    </IslandNamesContext.Provider>,
  );

  const { tags, islandCss } = await createAssets([...islandNames]);
  const emitted = new Set<IslandName>();

  const html = renderToString(
    <IslandCssContext.Provider value={{ cssByName: islandCss, emitted }}>
      <Document assets={tags}>
        <Page {...props} />
      </Document>
    </IslandCssContext.Provider>,
  );

  return `<!DOCTYPE html>${html}`;
}
