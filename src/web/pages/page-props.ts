import type { HomePageProps } from './home-page.props.js';
import type { LoginPageProps } from './login-page.props.js';
import type { RegisterPageProps } from './register-page.props.js';

/**
 * Props for each registered server page, keyed by page name.
 *
 * Controllers and `WebViewService.render` use this map so each page keeps its
 * own props type without a growing union on every call site. Add a key when
 * scaffolding a new page.
 */
export type PagePropsMap = {
  home: HomePageProps;
  login: LoginPageProps;
  register: RegisterPageProps;
};

/** Page names the server entry knows how to render. */
export type WebPageName = keyof PagePropsMap;
