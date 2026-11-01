import type { PageAssets } from './page-assets.js';
import type { RenderResult } from './render-result.js';

export type { RenderResult } from './render-result.js';

/**
 * Host-owned map of page name → SSR embed props.
 *
 * Product apps define a concrete map (for example Nest `SsrPagePropsMap`).
 * Core stays free of app page-prop modules ([ADR-0032](../../../docs/adr/0032-archipielago-pnpm-monorepo.md)).
 */
export type PagePropsMap = Record<string, object>;

/**
 * Server render function implemented by the Vite SSR bundle (`entry-server`).
 *
 * Page prop types stay app-owned. Returns a full-document {@link RenderResult}.
 *
 * @template {PagePropsMap} TPages - Host page name → props map.
 */
export interface ServerEntry<TPages extends PagePropsMap = PagePropsMap> {
  render<K extends keyof TPages & string>(
    page: K,
    props: TPages[K],
    createAssets: (islandNames: string[]) => PageAssets | Promise<PageAssets>,
    csrfToken?: string,
  ): Promise<RenderResult>;
}
