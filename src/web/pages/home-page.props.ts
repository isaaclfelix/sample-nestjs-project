/**
 * Props for the server-rendered home page.
 *
 * Kept in a TypeScript file so the Nest controller can type the object
 * without importing a TSX component.
 */
export interface HomePageProps {
  renderedAt: string;
}

/** Page names the server entry knows how to render. */
export type WebPageName = 'home';
