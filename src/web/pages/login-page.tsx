import type { ReactElement } from 'react';
import { Island } from '../islands/island.js';
import LoginForm from '../islands/login-form.js';
import Layout from '../ssr-components/layout.js';
import type { LoginPageProps } from './login-page.props.js';

/**
 * Renders the login page body.
 *
 * Server-only: this component is not part of the client bundle. The form is
 * an island for future interactivity; form CSS comes from the opt-in sibling
 * stylesheet, not an island module.
 *
 * @param {LoginPageProps} _props - No request props yet.
 * @returns {ReactElement} The page body, without the document shell.
 */
export function LoginPage(_props: LoginPageProps): ReactElement {
  return (
    <Layout>
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
