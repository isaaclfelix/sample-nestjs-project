import type { ReactElement } from 'react';
import { useApiMutation } from '../hooks/use-api-mutation.js';

/**
 * Logout control that clears the session then navigates home.
 *
 * Best-effort: always redirects to `/` after the attempt, including when the
 * session already expired (**403** CSRF / **401**). Uses the mutation hook's
 * `isPending` because this island has no react-hook-form.
 *
 * @returns {ReactElement} Interactive logout button.
 */
export default function LogoutButton(): ReactElement {
  const { mutate, isPending } = useApiMutation('/api/auth/logout');

  /**
   * Posts logout and always navigates home afterward.
   *
   * @returns {Promise<void>}
   */
  const handleClick = async (): Promise<void> => {
    try {
      await mutate();
    } catch {
      // Network errors still clear chrome via navigation.
    }
    window.location.assign('/');
  };

  return (
    <button
      type="button"
      className="btn btn-light btn-sm navigation-link"
      disabled={isPending}
      onClick={() => {
        void handleClick();
      }}
    >
      {isPending ? 'Logging out…' : 'Logout'}
    </button>
  );
}
