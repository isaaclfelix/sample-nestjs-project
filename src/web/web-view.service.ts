import { Injectable } from '@nestjs/common';
import { loadClientManifest } from './assets/asset-tags.js';
import { createPageAssets } from './assets/page-assets.js';
import { getViteDevServer, loadServerEntry } from './page-loader.js';
import { pageStylesheetsByPage } from './assets/page-stylesheets.js';
import type { PagePropsMap, WebPageName } from './pages/page-props.js';

@Injectable()
export class WebViewService {
  /**
   * Renders one server page to a full HTML document.
   *
   * The controller chooses the page name and props. This method loads the
   * React entry and returns the document string. The shared stylesheet is
   * always included (linked or inlined). Opt-in page siblings (e.g. forms)
   * are linked when {@link pageStylesheetsByPage} lists them for the page.
   * Client scripts are included only when the page rendered at least one
   * island. Island CSS is inlined as sibling `<style>` tags for islands used
   * on the page. When `csrfToken` is provided it is embedded as a meta tag.
   *
   * @template {WebPageName} K - Page key in {@link PagePropsMap}.
   * @param {K} page - Registered page name, not a component.
   * @param {PagePropsMap[K]} props - JSON-serializable props for that page.
   * @param {{ csrfToken?: string }} [options] - Optional CSRF token from the session.
   * @returns {Promise<string>} HTML document including the doctype.
   */
  async render<K extends WebPageName>(
    page: K,
    props: PagePropsMap[K],
    options: { csrfToken?: string } = {},
  ): Promise<string> {
    const vite = getViteDevServer();
    const entry = await loadServerEntry({
      vite,
      vitest: process.env.VITEST === 'true',
    });

    const development = vite !== undefined || process.env.VITEST === 'true';
    const pageStylesheets = pageStylesheetsByPage[page];

    return entry.render(
      page,
      props,
      (islandNames) =>
        createPageAssets(islandNames, {
          development,
          manifest: development ? undefined : loadClientManifest(),
          vite:
            vite?.transformRequest !== undefined
              ? { transformRequest: vite.transformRequest.bind(vite) }
              : undefined,
          pageStylesheets,
        }),
      options.csrfToken,
    );
  }
}
