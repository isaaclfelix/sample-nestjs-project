import type { ReactElement } from 'react';
import { Island } from '../island-runtime/island.js';
import LoginForm from '../islands/login-form.js';
import Layout from '../ssr-components/layout.js';
import type { LoginPageProps } from './login-page.props.js';

/**
 * Renders the login page body.
 *
 * Server-only: this component is not part of the client bundle. The form is
 * an island; form CSS comes from the opt-in sibling stylesheet. Guest-only:
 * the controller redirects authenticated sessions before render.
 *
 * @param {LoginPageProps} props - Auth flag (always false for this route).
 * @returns {ReactElement} The page body, without the document shell.
 */
export function LoginPage({ isAuthenticated }: LoginPageProps): ReactElement {
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
