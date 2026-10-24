import { Injectable } from '@nestjs/common';
import { assetTagsForIslands, loadClientManifest } from './asset-tags.js';
import { getViteDevServer, loadServerEntry } from './page-loader.js';
import type { HomePageProps, WebPageName } from './pages/home-page.props.js';

@Injectable()
export class WebViewService {
  /**
   * Renders one server page to a full HTML document.
   *
   * The controller chooses the page name and props. This method loads the
   * React entry and returns the document string. The shared stylesheet is
   * always included. Client scripts are included only when the page rendered
   * at least one island.
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

    const development =
      getViteDevServer() !== undefined || process.env.VITEST === 'true';

    return entry.render(page, props, (islandNames) =>
      assetTagsForIslands(islandNames, {
        development,
        // Production always reads the manifest so the shell stylesheet can be linked.
        manifest: development ? undefined : loadClientManifest(),
      }),
    );
  }
}
