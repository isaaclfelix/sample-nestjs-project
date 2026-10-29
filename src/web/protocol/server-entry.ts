import type { PageAssets } from './page-assets.js';
import type { SsrPagePropsMap, WebPageName } from './page-props/page-props.js';

/**
 * Server render function implemented by the Vite SSR bundle (`ui` entry-server).
 */
export interface ServerEntry {
  render<K extends WebPageName>(
    page: K,
    props: SsrPagePropsMap[K],
    createAssets: (islandNames: string[]) => PageAssets | Promise<PageAssets>,
    csrfToken?: string,
  ): Promise<string>;
}
