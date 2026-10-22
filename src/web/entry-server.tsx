import { renderToString } from 'react-dom/server';
import type { AssetTags } from './asset-tags.js';
import { Document } from './document.js';
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
 * @param {AssetTags} assets - Stylesheet and script URLs for the shell.
 * @returns {Promise<string>} Document string starting with a doctype.
 */
export async function render(
  page: WebPageName,
  props: HomePageProps,
  assets: AssetTags,
): Promise<string> {
  const Page = pages[page];
  const html = renderToString(
    <Document assets={assets}>
      <Page {...props} />
    </Document>,
  );

  return `<!DOCTYPE html>${html}`;
}
