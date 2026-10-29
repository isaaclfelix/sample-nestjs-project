import { CSRF_META_NAME } from '../../../api/auth/session.constants.js';

/**
 * Reads the session CSRF token from the SSR-embedded meta tag.
 *
 * Call this when a raw token string is needed. Prefer
 * {@link getCsrfTokenHeader} when building `fetch` headers.
 *
 * @returns {string} The CSRF token from `<meta name="csrf-token">`.
 * @throws {Error} When the meta tag is missing or has an empty content.
 */
export function getCsrfToken(): string {
  const token = document
    .querySelector(`meta[name="${CSRF_META_NAME}"]`)
    ?.getAttribute('content');

  if (!token) {
    throw new Error('Missing CSRF meta token');
  }

  return token;
}

/**
 * Returns a headers fragment with the current CSRF token.
 *
 * Spread into a `fetch` `headers` object so the token is read at request
 * time (important after login rotates the session CSRF).
 *
 * @returns {Record<string, string>} `{ 'X-CSRF-TOKEN': … }` for header spreads.
 */
export function getCsrfTokenHeader(): Record<string, string> {
  return { 'X-CSRF-TOKEN': getCsrfToken() };
}
