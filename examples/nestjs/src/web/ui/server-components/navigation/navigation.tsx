import { Island } from '@archipielago/react/runtime/island/island';
import LogoutButton from '@ui/islands/logout-button';
import MobileNavigation from '@ui/islands/mobile-navigation';

/**
 * Navigation component for the application.
 *
 * Guest chrome shows Login / Register. Authenticated chrome shows Logout
 * (island) so CSRF-backed `POST /api/auth/logout` can run in the browser.
 *
 * @param {{ isAuthenticated: boolean }} props - Whether the session is signed in.
 * @returns {React.ReactNode} The navigation component.
 */
export default function Navigation({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}): React.ReactNode {
  return (
    <nav>
      <div className="container p-4">
        <div className="navigation-row row">
          <div className="navigation-logo col display-6">
            <a href="/" className="navigation-logo-link">
              bed.dev
            </a>
          </div>
          <div className="navigation-separator col d-none d-md-flex" />
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
            <ul className="navigation-list list-unstyled d-none d-md-flex mb-0 align-items-center">
              {isAuthenticated ? (
                <li>
                  <Island
                    name="logout-button"
                    component={LogoutButton}
                    props={{}}
                  />
                </li>
              ) : (
                <>
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
                </>
              )}
            </ul>

            <Island
              name="mobile-navigation"
              component={MobileNavigation}
              props={{ isAuthenticated }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
