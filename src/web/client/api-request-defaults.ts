/**
 * Shared `RequestInit` defaults for same-origin mutating API calls.
 *
 * Spread into `fetch` options. Callers merge `headers` with
 * {@link getCsrfTokenHeader} and their own overrides — shallow spread of
 * this object alone replaces `headers` entirely.
 */
export const apiRequestDefaults = {
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json',
  },
} as const satisfies RequestInit;
