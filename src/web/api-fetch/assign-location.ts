/**
 * Navigates the browser to `url` via `window.location.assign`.
 *
 * Islands call this instead of `location.assign` directly so unit tests can
 * mock navigation without redefining the non-configurable Location API in
 * Chromium (Vitest browser mode).
 *
 * @param {string} url - Absolute path or URL to navigate to.
 * @returns {void}
 */
export function assignLocation(url: string): void {
  window.location.assign(url);
}
