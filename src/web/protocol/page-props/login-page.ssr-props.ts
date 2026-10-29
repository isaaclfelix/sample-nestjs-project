/**
 * SSR embed props for the login page component (`ui/pages/login-page.tsx`).
 *
 * Built by Nest (`WebController`), passed through `WebViewService.render`,
 * consumed by the Vite SSR page. JSON-serializable only. Not colocated with
 * the page on purpose — see ADR-0023 / how-to-web-ui (SSR page props quirk).
 *
 * Guest-only: the controller redirects authenticated sessions to `/` before
 * render.
 */
export interface LoginPageSsrProps {
  /** Always false when this page is rendered (guest-only route). */
  isAuthenticated: boolean;
}
