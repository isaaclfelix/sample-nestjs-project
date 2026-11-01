/**
 * SSR embed props for the register page component (`ui/pages/register-page/`).
 *
 * Built by Nest (`WebController`), passed through `WebViewService.render`,
 * consumed by the Vite SSR page. JSON-serializable only. Not colocated with
 * the page on purpose — see ADR-0023 / how-to-web-ui (SSR page props quirk).
 *
 * Guest-only: the controller redirects authenticated sessions to `/` before
 * render.
 */
export interface RegisterPageSsrProps {
  /** Always false when this page is rendered (guest-only route). */
  isAuthenticated: boolean;
}
