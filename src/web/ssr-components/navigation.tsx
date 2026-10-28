import { Island } from '../islands/island';
import MobileNavigation from '../islands/mobile-navigation';

/**
 * Navigation component for the application.
 *
 * This component is used to render the navigation for the application.
 *
 * @returns {React.ReactNode} The navigation component.
 */
export default function Navigation(): React.ReactNode {
  return (
    <nav>
      <div className="navigation-container container">
        <div className="navigation-row row">
          <div className="navigation-logo col display-6">
            <a href="/" className="navigation-logo-link">
              bed.dev
            </a>
          </div>
          <div className="navigation-separator col" />
          <div className="navigation-left col d-none d-md-flex">
            <ul className="navigation-list list-unstyled d-flex mb-0">
              <li>
                <a href="/" className="navigation-link">
                  Home
                </a>
              </li>
              <li>
                <a href="/api/docs" className="navigation-link">
                  Swagger Docs
                </a>
              </li>
            </ul>
          </div>
          <div className="navigation-right col d-flex">
            <ul className="navigation-list list-unstyled d-none d-md-flex mb-0">
              <li>
                <a href="/login" className="navigation-link">
                  Login
                </a>
              </li>
              <li>
                <a href="/register" className="navigation-link">
                  Register
                </a>
              </li>
            </ul>

            <Island
              name="mobile-navigation"
              component={MobileNavigation}
              props={{}}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
