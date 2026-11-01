/**
 * Whether this request path should load or create a session.
 *
 * Skips Vite/dev assets and static files so HMR does not mint sessions.
 *
 * @param {string} path - Express `req.path`.
 * @returns {boolean} True for `/api` and HTML page routes.
 */
export function shouldAttachSession(path: string): boolean {
  if (path.startsWith('/api')) {
    return true;
  }
  if (
    path.startsWith('/@') ||
    path.startsWith('/src/') ||
    path.startsWith('/assets') ||
    path.startsWith('/node_modules')
  ) {
    return false;
  }
  // Skip hashed/static filenames (e.g. app.js, styles.css).
  if (path.includes('.') && path !== '/') {
    return false;
  }
  return true;
}
