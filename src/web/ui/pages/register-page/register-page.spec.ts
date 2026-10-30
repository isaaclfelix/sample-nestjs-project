import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { CSRF_META_NAME } from '@api/auth/session.constants';
import { RegisterPage } from './register-page';

describe('RegisterPage', () => {
  beforeEach(() => {
    document.head.innerHTML = `<meta name="${CSRF_META_NAME}" content="csrf-test" />`;
  });

  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('renders the register form island', () => {
    render(createElement(RegisterPage, { isAuthenticated: false }));

    expect(
      screen.getByRole('button', { name: 'Create account' }),
    ).toBeInTheDocument();
  });
});
