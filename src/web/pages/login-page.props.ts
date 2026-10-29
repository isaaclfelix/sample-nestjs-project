/**
 * Props for the server-rendered login page.
 *
 * Kept in a TypeScript file so the Nest controller can type the object
 * without importing a TSX component. Guest-only: the controller redirects
 * authenticated sessions to `/` before render.
 */
export interface LoginPageProps {
  /** Always false when this page is rendered (guest-only route). */
  isAuthenticated: boolean;
}
