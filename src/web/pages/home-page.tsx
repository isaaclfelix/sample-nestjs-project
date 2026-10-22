import type { ReactElement } from 'react';
import type { HomePageProps } from './home-page.props.js';

/**
 * Renders the home page body.
 *
 * Server-only: this component is not part of the client bundle. The
 * timestamp is props from the controller so the view does not read the clock.
 *
 * @param {HomePageProps} props - When the server rendered this response.
 * @returns {ReactElement} The page body, without the document shell.
 */
export function HomePage({ renderedAt }: HomePageProps): ReactElement {
  // One string so server HTML does not split the timestamp with comment markers.
  const renderedLine = `Rendered on the server at ${renderedAt}.`;

  return (
    <main>
      <p>{renderedLine}</p>
    </main>
  );
}
