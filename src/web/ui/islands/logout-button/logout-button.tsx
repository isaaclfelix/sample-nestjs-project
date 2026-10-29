import type { ReactElement } from 'react';
import { assignLocation } from '../../api-fetch/assign-location';
import { useApiMutation } from '../../hooks/use-api-mutation';

/**
 * Logout control that clears the session then navigates to login.
 *
 * Best-effort: always redirects to `/login` after the attempt, including when
 * the session already expired (**403** CSRF / **401**). Uses the mutation
 * hook's `isPending` because this island has no react-hook-form.
 *
 * @returns {ReactElement} Interactive logout button.
 */
export default function LogoutButton(): ReactElement {
  const { mutate, isPending } = useApiMutation('/api/auth/logout');

  /**
   * Posts logout and always navigates to `/login` afterward.
   *
   * @returns {Promise<void>}
   */
  const handleClick = async (): Promise<void> => {
    try {
      await mutate();
    } catch {
      // Network errors still clear chrome via navigation.
    }
    assignLocation('/login');
  };

  return (
    <button
      type="button"
      className="btn btn-link navigation-link"
      disabled={isPending}
      onClick={() => {
        void handleClick();
      }}
    >
      {isPending ? 'Logging out…' : 'Logout'}
    </button>
  );
}
