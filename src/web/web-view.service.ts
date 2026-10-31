import { Injectable } from '@nestjs/common';
import { loadClientManifest } from '../archipielago/host/asset-delivery/asset-tags.js';
import { createPageAssets } from '../archipielago/host/asset-delivery/page-assets.js';
import { pageStylesheetsByPage } from '../archipielago/host/asset-delivery/page-stylesheets.js';
import {
  getViteDevServer,
  loadServerEntry,
} from '../archipielago/host/page-loader.js';
import type {
  SsrPagePropsMap,
  WebPageName,
} from './protocol/page-props/page-props.js';

@Injectable()
export class WebViewService {
  /**
   * Renders one server page to a full HTML document.
   *
   * The controller chooses the page name and SSR embed props. This method
   * loads the React entry and returns the document string. The shared
   * stylesheet is always included (linked or inlined). Opt-in page siblings
   * (e.g. forms) are linked when {@link pageStylesheetsByPage} lists them for
   * the page. Client scripts are included only when the page rendered at least
   * one island. Island CSS is inlined as sibling `<style>` tags for islands
   * used on the page. When `csrfToken` is provided it is embedded as a meta tag.
   *
   * @template {WebPageName} K - Page key in {@link SsrPagePropsMap}.
   * @param {K} page - Registered page name, not a component.
   * @param {SsrPagePropsMap[K]} props - JSON-serializable SSR embed props.
   * @param {{ csrfToken?: string }} [options] - Optional CSRF token from the session.
   * @returns {Promise<string>} HTML document including the doctype.
   */
  async render<K extends WebPageName>(
    page: K,
    props: SsrPagePropsMap[K],
    options: { csrfToken?: string } = {},
  ): Promise<string> {
    const vite = getViteDevServer();
    const entry = await loadServerEntry({
      vite,
      vitest: process.env.VITEST === 'true',
    });

    const development = vite !== undefined || process.env.VITEST === 'true';
    const pageStylesheets = pageStylesheetsByPage[page];

    const result = await entry.render(
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

    // Nest returns the full document; assets stay available on RenderResult
    // for logging or a future host that assembles HTML differently.
    return result.html;
  }
}
