import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import type { PageAssets } from '../../../protocol/page-assets.js';
import type {
  SsrPagePropsMap,
  WebPageName,
} from '../../../protocol/page-props/page-props.js';
import type { IslandName } from '../../../protocol/island-css-catalog.js';
import { HomePage } from '../../pages/home-page.js';
import { LoginPage } from '../../pages/login-page.js';
import { RegisterPage } from '../../pages/register-page.js';
import { Document } from '../../server-components/document.js';
import { IslandCssContext, IslandNamesContext } from '../island/island.js';

const pages = {
  home: HomePage,
  login: LoginPage,
  register: RegisterPage,
} as const satisfies {
  [K in WebPageName]: (props: SsrPagePropsMap[K]) => ReactElement;
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
 * @template {WebPageName} K - Page key in {@link SsrPagePropsMap}.
 * @param {K} page - Key in the page map.
 * @param {SsrPagePropsMap[K]} props - SSR embed props for that page.
 * @param {(islandNames: string[]) => PageAssets | Promise<PageAssets>} createAssets - Builds tags and island CSS from used islands.
 * @param {string} [csrfToken] - Session CSRF token to embed in a meta tag.
 * @returns {Promise<string>} Document string starting with a doctype.
 */
export async function render<K extends WebPageName>(
  page: K,
  props: SsrPagePropsMap[K],
  createAssets: (islandNames: string[]) => PageAssets | Promise<PageAssets>,
  csrfToken?: string,
): Promise<string> {
  const Page = pages[page] as (props: SsrPagePropsMap[K]) => ReactElement;
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
      <Document assets={tags} csrfToken={csrfToken}>
        <Page {...props} />
      </Document>
    </IslandCssContext.Provider>,
  );

  return `<!DOCTYPE html>${html}`;
}
