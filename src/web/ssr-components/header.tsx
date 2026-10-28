import Navigation from '../islands/navigation';

/**
 * Header component for the website.
 *
 * This component is used to render the header for the website.
 * It contains the navigation.
 *
 * @returns {React.ReactNode} The header component.
 */
export default function Header(): React.ReactNode {
  return (
    <header className="site-header">
      <Navigation />
    </header>
  );
}
