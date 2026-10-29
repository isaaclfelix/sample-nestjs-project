import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { CSRF_META_NAME } from '../../../api/auth/session.constants.js';
import { LoginPage } from './login-page.js';

describe('LoginPage', () => {
  beforeEach(() => {
    document.head.innerHTML = `<meta name="${CSRF_META_NAME}" content="csrf-test" />`;
  });

  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('renders the login form island', () => {
    render(createElement(LoginPage, { isAuthenticated: false }));

    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });
});
