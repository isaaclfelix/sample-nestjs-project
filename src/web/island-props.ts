/**
 * Encodes island props for a `data-props` attribute.
 *
 * `encodeURIComponent` keeps quotes and `<` out of the attribute so the
 * JSON cannot break the tag. Props must already be JSON-serializable.
 *
 * @param {object} props - Plain props shared by the server render and the browser.
 * @returns {string} URI-encoded JSON.
 */
export function encodeIslandProps(props: object): string {
  return encodeURIComponent(JSON.stringify(props));
}

/**
 * Decodes island props written by `encodeIslandProps`.
 *
 * Rejects arrays and non-objects so a bad attribute fails closed instead of
 * being spread into a component.
 *
 * @param {string} encoded - URI-encoded JSON object from `data-props`.
 * @returns {Record<string, unknown>} The decoded props object.
 */
export function decodeIslandProps(encoded: string): Record<string, unknown> {
  const value: unknown = JSON.parse(decodeURIComponent(encoded));

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Island props must be a JSON object.');
  }

  return value as Record<string, unknown>;
}
