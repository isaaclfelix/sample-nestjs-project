import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { loginSchema, type LoginDto } from '../../api/auth/dto/login.dto.js';
import type { UserResponseDto } from '../../api/user/dto/user-response.dto.js';
import { useApiMutation } from '../hooks/use-api-mutation.js';

/**
 * Maps a failed login HTTP status to a user-visible form alert.
 *
 * @param {number} status - Response status from the login mutation.
 * @returns {string} Message to show above the fields.
 */
function loginFormErrorMessage(status: number): string {
  if (status === 401) {
    return 'Invalid credentials.';
  }
  if (status === 403) {
    return 'Security token expired. Refresh the page and try again.';
  }
  if (status === 429) {
    return 'Too many login attempts. Wait a minute and try again.';
  }
  return 'Something went wrong. Please try again.';
}

/**
 * Login form island wired to `POST /api/auth/login`.
 *
 * Validates with the shared `loginSchema` via react-hook-form, then mutates
 * through {@link useApiMutation}. On success, navigates to `/`. Pending UI
 * uses RHF `isSubmitting` (not the mutation hook's `isPending`). Resting and
 * validation form CSS come from the opt-in `forms` sibling stylesheet.
 *
 * @returns {ReactElement} Interactive island markup.
 */
export default function LoginForm(): ReactElement {
  const { mutate } = useApiMutation<LoginDto, UserResponseDto>(
    '/api/auth/login',
  );
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
  });

  /**
   * Submits credentials and redirects home on success.
   *
   * @param {LoginDto} values - Validated identifier and password.
   * @returns {Promise<void>}
   */
  const onSubmit = handleSubmit(async (values: LoginDto): Promise<void> => {
    setFormError(null);
    const result = await mutate(values);
    if (result.ok) {
      window.location.assign('/');
      return;
    }
    setFormError(loginFormErrorMessage(result.status));
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      {formError !== null ? (
        <div className="alert alert-danger" role="alert">
          {formError}
        </div>
      ) : null}

      <div className="mb-3">
        <label className="form-label" htmlFor="login-identifier">
          Email or username
        </label>
        <input
          id="login-identifier"
          type="text"
          className={`form-control${errors.identifier ? ' is-invalid' : ''}`}
          autoComplete="username"
          aria-invalid={errors.identifier ? true : undefined}
          aria-describedby={
            errors.identifier ? 'login-identifier-error' : undefined
          }
          {...register('identifier')}
        />
        {errors.identifier ? (
          <div id="login-identifier-error" className="invalid-feedback">
            {errors.identifier.message}
          </div>
        ) : null}
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          className={`form-control${errors.password ? ' is-invalid' : ''}`}
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={
            errors.password ? 'login-password-error' : undefined
          }
          {...register('password')}
        />
        {errors.password ? (
          <div id="login-password-error" className="invalid-feedback">
            {errors.password.message}
          </div>
        ) : null}
      </div>

      <button type="submit" className="btn btn-light" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in…' : 'Log in'}
      </button>
      <p className="mt-3 mb-0">
        <a href="/register">Create an account</a>
      </p>
    </form>
  );
}
