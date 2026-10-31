/**
 * Parses Vite `import.meta.glob` keys for product island entries.
 *
 * Convention: `…/islands/<name>/<name>.tsx` (dirname === basename).
 */

/**
 * Derives the island registry name from a glob key when it matches convention.
 *
 * @param {string} key - Vite glob key (relative or absolute-looking path).
 * @returns {string | undefined} Kebab island name, or undefined when not conventional.
 */
export function islandNameFromGlobKey(key: string): string | undefined {
  const match = /\/islands\/([^/]+)\/([^/]+)\.tsx$/.exec(key);
  if (!match) {
    return undefined;
  }
  const [, folder, file] = match;
  if (folder === undefined || file === undefined || folder !== file) {
    return undefined;
  }
  return folder;
}
