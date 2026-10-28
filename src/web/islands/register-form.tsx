import type { FormEvent, ReactElement } from 'react';

/**
 * Register form island (initial state).
 *
 * Fields mirror `createUserSchema` (email, username, displayName, password).
 * Uncontrolled inputs; submit is prevented until API wiring exists.
 * Form CSS comes from the opt-in `forms` sibling stylesheet.
 *
 * @returns {ReactElement} Interactive island markup.
 */
export default function RegisterForm(): ReactElement {
  /**
   * Blocks the default navigation until registration wiring exists.
   *
   * @param {FormEvent<HTMLFormElement>} event - Submit event.
   * @returns {void}
   */
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-3">
        <label className="form-label" htmlFor="register-email">
          Email
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          className="form-control"
          autoComplete="email"
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="register-username">
          Username
        </label>
        <input
          id="register-username"
          name="username"
          type="text"
          className="form-control"
          autoComplete="username"
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="register-display-name">
          Display name
        </label>
        <input
          id="register-display-name"
          name="displayName"
          type="text"
          className="form-control"
          autoComplete="nickname"
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="register-password">
          Password
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          className="form-control"
          autoComplete="new-password"
        />
        <div className="form-text">At least 8 characters.</div>
      </div>
      <button type="submit" className="btn btn-light">
        Create account
      </button>
      <p className="mt-3 mb-0">
        <a href="/login">Already have an account? Log in</a>
      </p>
    </form>
  );
}
