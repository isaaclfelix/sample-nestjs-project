/**
 * Props for the server-rendered home page.
 *
 * Kept in a TypeScript file so the Nest controller can type the object
 * without importing a TSX component.
 */
export interface HomePageProps {
  renderedAt: string;
  /** True when the request session is bound to a user. */
  isAuthenticated: boolean;
}
