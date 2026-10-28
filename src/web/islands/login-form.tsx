import type { FormEvent, ReactElement } from 'react';

/**
 * Login form island (initial state).
 *
 * Uncontrolled fields; submit is prevented so the page does not reload.
 * Validation classes and API wiring land in a later plan. Resting and
 * validation form CSS come from the opt-in `forms` sibling stylesheet.
 *
 * @returns {ReactElement} Interactive island markup.
 */
export default function LoginForm(): ReactElement {
  /**
   * Blocks the default navigation until auth wiring exists.
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
        <label className="form-label" htmlFor="login-identifier">
          Email or username
        </label>
        <input
          id="login-identifier"
          name="identifier"
          type="text"
          className="form-control"
          autoComplete="username"
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          className="form-control"
          autoComplete="current-password"
        />
      </div>
      <button type="submit" className="btn btn-light">
        Log in
      </button>
      <p className="mt-3 mb-0">
        <a href="/register">Create an account</a>
      </p>
    </form>
  );
}
