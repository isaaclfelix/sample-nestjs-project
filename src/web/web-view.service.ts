import { Injectable } from '@nestjs/common';
import { emptyAssetTags } from './asset-tags.js';
import { getViteDevServer, loadServerEntry } from './page-loader.js';
import type { HomePageProps, WebPageName } from './pages/home-page.props.js';

@Injectable()
export class WebViewService {
  /**
   * Renders one server page to a full HTML document.
   *
   * The controller chooses the page name and props. This method loads the
   * React entry and returns the document string. Client scripts are omitted
   * until a page renders an island.
   *
   * @param {WebPageName} page - Registered page name, not a component.
   * @param {HomePageProps} props - JSON-serializable props for that page.
   * @returns {Promise<string>} HTML document including the doctype.
   */
  async render(page: WebPageName, props: HomePageProps): Promise<string> {
    const entry = await loadServerEntry({
      vite: getViteDevServer(),
      vitest: process.env.VITEST === 'true',
    });

    return entry.render(page, props, emptyAssetTags);
  }
}
