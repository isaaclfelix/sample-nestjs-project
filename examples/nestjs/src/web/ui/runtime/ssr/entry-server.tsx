import type { ComponentType, ReactElement } from 'react';
import type { PageAssets } from '@archipielago/core/page-assets';
import type { RenderResult } from '@archipielago/core/render-result';
import { renderDocument } from '@archipielago/react/runtime/ssr/render-document';
import type {
  SsrPagePropsMap,
  WebPageName,
} from '@protocol/page-props/page-props';
import { HomePage } from '@ui/pages/home-page';
import { LoginPage } from '@ui/pages/login-page';
import { RegisterPage } from '@ui/pages/register-page';
import { Document } from '@ui/server-components/document';

const pages = {
  home: HomePage,
  login: LoginPage,
  register: RegisterPage,
} as const satisfies {
  [K in WebPageName]: ComponentType<SsrPagePropsMap[K]>;
};

/**
 * Renders a named page to a full HTML document result.
 *
 * App-owned entry: registers the product page map and Document, then delegates
 * two-pass SSR to Archipielago. Controllers stay free of TSX.
 *
 * @template {WebPageName} K - Page key in {@link SsrPagePropsMap}.
 * @param {K} page - Key in the page map.
 * @param {SsrPagePropsMap[K]} props - SSR embed props for that page.
 * @param {(islandNames: string[]) => PageAssets | Promise<PageAssets>} createAssets - Builds tags and island CSS from used islands.
 * @param {string} [csrfToken] - Session CSRF token to embed in a meta tag.
 * @returns {Promise<RenderResult>} Full document HTML plus the asset bag used.
 */
export async function render<K extends WebPageName>(
  page: K,
  props: SsrPagePropsMap[K],
  createAssets: (islandNames: string[]) => PageAssets | Promise<PageAssets>,
  csrfToken?: string,
): Promise<RenderResult> {
  const Page = pages[page] as (pageProps: SsrPagePropsMap[K]) => ReactElement;

  return renderDocument({
    renderPage: () => <Page {...props} />,
    Document,
    createAssets,
    csrfToken,
  });
}
