import type { HomePageSsrProps } from './home-page.ssr-props.js';
import type { LoginPageSsrProps } from './login-page.ssr-props.js';
import type { RegisterPageSsrProps } from './register-page.ssr-props.js';

/**
 * SSR embed props for each registered server page, keyed by page name.
 *
 * Controllers and `ArchipielagoViewService.render` use this map so each page keeps
 * its own props type without a growing union on every call site. Add a key when
 * scaffolding a new page (under `protocol/page-props/`, not beside the UI page).
 */
export type SsrPagePropsMap = {
  home: HomePageSsrProps;
  login: LoginPageSsrProps;
  register: RegisterPageSsrProps;
};

/** Page names the server entry knows how to render. */
export type WebPageName = keyof SsrPagePropsMap;
