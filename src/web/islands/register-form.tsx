import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import {
  createUserSchema,
  type CreateUserDto,
} from '../../api/user/dto/create-user.dto.js';
import type { UserResponseDto } from '../../api/user/dto/user-response.dto.js';
import { useApiMutation } from '../hooks/use-api-mutation.js';

/**
 * Maps a failed register HTTP status to a user-visible form alert.
 *
 * @param {number} status - Response status from the register mutation.
 * @param {unknown} data - Parsed error body when present.
 * @returns {string} Message to show above the fields.
 */
function registerFormErrorMessage(status: number, data: unknown): string {
  if (status === 409) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
        ? data.message
        : 'Email or username is already taken.';
    return message;
  }
  if (status === 403) {
    return 'Security token expired. Refresh the page and try again.';
  }
  if (status === 429) {
    return 'Too many registration attempts. Wait a minute and try again.';
  }
  return 'Something went wrong. Please try again.';
}

/**
 * Register form island wired to `POST /api/user`.
 *
 * Validates with shared `createUserSchema` via react-hook-form, then mutates
 * through {@link useApiMutation}. On success, navigates to `/login` (no
 * auto-login). Pending UI uses RHF `isSubmitting`. Form CSS comes from the
 * opt-in `forms` sibling stylesheet.
 *
 * @returns {ReactElement} Interactive island markup.
 */
export default function RegisterForm(): ReactElement {
  const { mutate } = useApiMutation<CreateUserDto, UserResponseDto>(
    '/api/user',
  );
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserDto>({
    resolver: zodResolver(createUserSchema),
  });

  /**
   * Creates the account and redirects to login on success.
   *
   * @param {CreateUserDto} values - Validated registration fields.
   * @returns {Promise<void>}
   */
  const onSubmit = handleSubmit(
    async (values: CreateUserDto): Promise<void> => {
      setFormError(null);
      const result = await mutate(values);
      if (result.ok) {
        window.location.assign('/login');
        return;
      }
      setFormError(registerFormErrorMessage(result.status, result.data));
    },
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      {formError !== null ? (
        <div className="alert alert-danger" role="alert">
          {formError}
        </div>
      ) : null}

      <div className="mb-3">
        <label className="form-label" htmlFor="register-email">
          Email
        </label>
        <input
          id="register-email"
          type="email"
          className={`form-control${errors.email ? ' is-invalid' : ''}`}
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'register-email-error' : undefined}
          {...register('email')}
        />
        {errors.email ? (
          <div id="register-email-error" className="invalid-feedback">
            {errors.email.message}
          </div>
        ) : null}
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="register-username">
          Username
        </label>
        <input
          id="register-username"
          type="text"
          className={`form-control${errors.username ? ' is-invalid' : ''}`}
          autoComplete="username"
          aria-invalid={errors.username ? true : undefined}
          aria-describedby={
            errors.username ? 'register-username-error' : undefined
          }
          {...register('username')}
        />
        {errors.username ? (
          <div id="register-username-error" className="invalid-feedback">
            {errors.username.message}
          </div>
        ) : null}
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="register-display-name">
          Display name
        </label>
        <input
          id="register-display-name"
          type="text"
          className={`form-control${errors.displayName ? ' is-invalid' : ''}`}
          autoComplete="nickname"
          aria-invalid={errors.displayName ? true : undefined}
          aria-describedby={
            errors.displayName ? 'register-display-name-error' : undefined
          }
          {...register('displayName')}
        />
        {errors.displayName ? (
          <div id="register-display-name-error" className="invalid-feedback">
            {errors.displayName.message}
          </div>
        ) : null}
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="register-password">
          Password
        </label>
        <input
          id="register-password"
          type="password"
          className={`form-control${errors.password ? ' is-invalid' : ''}`}
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={
            errors.password ? 'register-password-error' : undefined
          }
          {...register('password')}
        />
        {errors.password ? (
          <div id="register-password-error" className="invalid-feedback">
            {errors.password.message}
          </div>
        ) : (
          <div className="form-text">At least 12 characters.</div>
        )}
      </div>

      <button type="submit" className="btn btn-light" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>
      <p className="mt-3 mb-0">
        <a href="/login">Already have an account? Log in</a>
      </p>
    </form>
  );
}
