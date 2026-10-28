import { Island } from '../islands/island';
import Navigation from '../islands/navigation';

/**
 * Main layout component for the application.
 *
 * This component is used to wrap the application and provide a consistent layout for all pages.
 * For now it includes mostly a header with the navigation and a footer with the copyright information.
 *
 * @param children - The children to render.
 * @returns {React.ReactNode} The layout component.
 */
export default function Layout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <main>
      <header className="site-header">
        <Island name="navigation" component={Navigation} props={{}} />
      </header>

      {children}

      <footer></footer>
    </main>
  );
}
