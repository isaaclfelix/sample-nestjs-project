import type { ReactElement } from 'react';
import { Island } from '../../runtime/island/island';
import LoginForm from '../../islands/login-form';
import Layout from '../../server-components/layout';
import type { LoginPageSsrProps } from '../../../protocol/page-props/login-page.ssr-props';

/**
 * Renders the login page body.
 *
 * Server-only: this component is not part of the client bundle. The form is
 * an island; form CSS comes from the opt-in sibling stylesheet. Guest-only:
 * the controller redirects authenticated sessions before render.
 *
 * @param {LoginPageSsrProps} props - Auth flag (always false for this route).
 * @returns {ReactElement} The page body, without the document shell.
 */
export function LoginPage({
  isAuthenticated,
}: LoginPageSsrProps): ReactElement {
  return (
    <Layout isAuthenticated={isAuthenticated}>
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 col-lg-4">
            <h1 className="h3 mb-4">Log in</h1>
            <Island name="login-form" component={LoginForm} props={{}} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
