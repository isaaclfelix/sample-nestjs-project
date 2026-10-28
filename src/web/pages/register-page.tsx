import type { ReactElement } from 'react';
import { Island } from '../islands/island.js';
import RegisterForm from '../islands/register-form.js';
import Layout from '../ssr-components/layout.js';
import type { RegisterPageProps } from './register-page.props.js';

/**
 * Renders the register page body.
 *
 * Server-only: this component is not part of the client bundle. The form is
 * an island for future interactivity; form CSS comes from the opt-in sibling
 * stylesheet, not an island module.
 *
 * @param {RegisterPageProps} _props - No request props yet.
 * @returns {ReactElement} The page body, without the document shell.
 */
export function RegisterPage(_props: RegisterPageProps): ReactElement {
  return (
    <Layout>
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 col-lg-4">
            <h1 className="h3 mb-4">Create account</h1>
            <Island name="register-form" component={RegisterForm} props={{}} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
