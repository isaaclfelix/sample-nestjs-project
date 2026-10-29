/**
 * SSR embed props for the home page component (`ui/pages/home-page/`).
 *
 * Built by Nest (`WebController`), passed through `WebViewService.render`,
 * consumed by the Vite SSR page. JSON-serializable only. Not colocated with
 * the page on purpose — see ADR-0023 / how-to-web-ui (SSR page props quirk).
 */
export interface HomePageSsrProps {
  renderedAt: string;
  /** True when the request session is bound to a user. */
  isAuthenticated: boolean;
}
