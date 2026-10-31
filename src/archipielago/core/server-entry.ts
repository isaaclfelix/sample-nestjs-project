import type { PageAssets } from './page-assets.js';
import type {
  SsrPagePropsMap,
  WebPageName,
} from '../../web/protocol/page-props/page-props.js';

/**
 * Server render function implemented by the Vite SSR bundle (`ui` entry-server).
 *
 * Page prop types stay app-owned under `src/web/protocol/page-props/`. Core
 * imports them in-repo for typed `render` until a later slice generics the
 * contract for package extraction.
 */
export interface ServerEntry {
  render<K extends WebPageName>(
    page: K,
    props: SsrPagePropsMap[K],
    createAssets: (islandNames: string[]) => PageAssets | Promise<PageAssets>,
    csrfToken?: string,
  ): Promise<string>;
}
