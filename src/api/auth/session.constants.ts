/** Cookie name for the opaque session id. */
export const SESSION_COOKIE_NAME = 'sid';

/** Request header carrying the CSRF token (Laravel-style). */
export const CSRF_HEADER_NAME = 'x-csrf-token';

/** HTML meta name that SSR embeds for browser forms. */
export const CSRF_META_NAME = 'csrf-token';

/** Guest and authenticated session lifetime. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
