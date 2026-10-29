import type { ReactElement } from 'react';
import { Island } from '../runtime/island/island';
import RegisterForm from '../islands/register-form';
import Layout from '../server-components/layout';
import type { RegisterPageSsrProps } from '../../protocol/page-props/register-page.ssr-props';

/**
 * Renders the register page body.
 *
 * Server-only: this component is not part of the client bundle. The form is
 * an island; form CSS comes from the opt-in sibling stylesheet. Guest-only:
 * the controller redirects authenticated sessions before render.
 *
 * @param {RegisterPageSsrProps} props - Auth flag (always false for this route).
 * @returns {ReactElement} The page body, without the document shell.
 */
export function RegisterPage({
  isAuthenticated,
}: RegisterPageSsrProps): ReactElement {
  return (
    <Layout isAuthenticated={isAuthenticated}>
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
