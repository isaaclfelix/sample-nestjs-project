import type { ReactElement } from 'react';
import type { HomePageSsrProps } from '../../protocol/page-props/home-page.ssr-props.js';
import Layout from '../server-components/layout.js';

/**
 * Renders the home page body.
 *
 * Server-only: this component is not part of the client bundle. The
 * timestamp is SSR embed props from the controller so the view does not read
 * the clock. Interactive chrome (mobile nav) comes from Layout / Navigation
 * islands.
 *
 * @param {HomePageSsrProps} props - When the server rendered this response and auth.
 * @returns {ReactElement} The page body, without the document shell.
 */
export function HomePage({
  renderedAt,
  isAuthenticated,
}: HomePageSsrProps): ReactElement {
  // One string so server HTML does not split the timestamp with comment markers.
  const renderedLine = `Rendered on the server at ${renderedAt}.`;

  return (
    <Layout isAuthenticated={isAuthenticated}>
      <p>{renderedLine}</p>
    </Layout>
  );
}
