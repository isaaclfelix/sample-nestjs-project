/**
 * Chooses whether production should inline the shell CSS or keep a link.
 *
 * Compares **uncompressed** CSS byte length to the budget. That matches what
 * goes into the HTML document. The Vite budget plugin still reports gzip
 * separately for transfer-size awareness.
 *
 * @param {string} cssText - Built shell stylesheet source.
 * @param {number} budgetBytes - Max raw bytes allowed to inline.
 * @returns {{ mode: 'inline'; css: string } | { mode: 'link' }} Delivery mode.
 */
export function chooseShellDelivery(
  cssText: string,
  budgetBytes: number,
): { mode: 'inline'; css: string } | { mode: 'link' } {
  const rawBytes = Buffer.byteLength(cssText, 'utf8');

  if (rawBytes <= budgetBytes) {
    return { mode: 'inline', css: cssText };
  }

  return { mode: 'link' };
}
