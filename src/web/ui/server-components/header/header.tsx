import Navigation from '@ui/server-components/navigation';

/**
 * Header component for the website.
 *
 * This component is used to render the header for the website.
 * It contains the navigation.
 *
 * @param {{ isAuthenticated: boolean }} props - Whether the session is signed in.
 * @returns {React.ReactNode} The header component.
 */
export default function Header({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}): React.ReactNode {
  return (
    <header className="site-header">
      <Navigation isAuthenticated={isAuthenticated} />
    </header>
  );
}
