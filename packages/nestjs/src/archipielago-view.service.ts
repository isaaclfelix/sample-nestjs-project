import { Inject, Injectable } from '@nestjs/common';
import type { PagePropsMap } from '@archipielago/core/server-entry.js';
import { loadClientManifest } from '@archipielago/vite/asset-delivery/asset-tags.js';
import { createPageAssets } from '@archipielago/vite/asset-delivery/page-assets.js';
import type { PageStylesheetName } from '@archipielago/vite/asset-delivery/page-stylesheets.js';
import {
  getViteDevServer,
  loadServerEntry,
} from '@archipielago/vite/page-loader.js';
import {
  ARCHIPIELAGO_NEST_OPTIONS,
  type ArchipielagoNestOptions,
} from './archipielago-nest.options.js';

@Injectable()
export class ArchipielagoViewService {
  constructor(
    @Inject(ARCHIPIELAGO_NEST_OPTIONS)
    private readonly options: ArchipielagoNestOptions = {},
  ) {}

  /**
   * Renders one server page to a full HTML document.
   *
   * The controller chooses the page name and SSR embed props. This method
   * loads the React entry and returns the document string. The shared
   * stylesheet is always included (linked or inlined). The host may provide
   * page-specific stylesheet names through module options or per-call options.
   * Client scripts are included only when the page rendered at least one
   * island. When `csrfToken` is provided it is embedded as a meta tag.
   *
   * @template {PagePropsMap} TPages - Host-owned page props map.
   * @template {keyof TPages & string} K - Page key in the host map.
   * @param {K} page - Registered page name, not a component.
   * @param {TPages[K]} props - JSON-serializable SSR embed props.
   * @param {{ csrfToken?: string; pageStylesheets?: readonly PageStylesheetName[] }} [options] -
   * Optional request metadata and explicit stylesheet names.
   * @returns {Promise<string>} HTML document including the doctype.
   */
  async render<TPages extends PagePropsMap, K extends keyof TPages & string>(
    page: K,
    props: TPages[K],
    options: {
      csrfToken?: string;
      pageStylesheets?: readonly PageStylesheetName[];
    } = {},
  ): Promise<string> {
    // Resolve the active server entry from Vite in development or disk in production.
    const vite = getViteDevServer();
    const entry = await loadServerEntry({
      vite,
      vitest: process.env.VITEST === 'true',
    });

    const development = vite !== undefined || process.env.VITEST === 'true';
    // Per-render stylesheet choices override the app-wide resolver.
    const pageStylesheets =
      options.pageStylesheets ?? this.options.getPageStylesheets?.(page);

    // Let the server entry request only the assets needed by rendered islands.
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
