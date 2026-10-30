import { gzipSync } from 'node:zlib';
import type { Plugin } from 'vite';
import {
  DEFAULT_SHELL_CSS_BUDGET_BYTES,
  shellCssBudgetBytes,
} from '../../protocol/shell-css-budget.js';

export { DEFAULT_SHELL_CSS_BUDGET_BYTES, shellCssBudgetBytes };

/** Minimal shape of a Rollup CSS asset used for the shell size audit. */
interface ShellCssAsset {
  type: 'asset';
  fileName: string;
  source: string | Uint8Array;
  originalFileNames?: readonly string[];
}

/** Minimal shape of a Rollup output bundle for the shell size audit. */
type ShellCssBundle = Record<string, { type: string } | ShellCssAsset>;

/**
 * Returns whether a Rollup asset is the shared shell stylesheet.
 *
 * Matches the `shell` client input (`styles/shell.scss`) by original file name or
 * by the Vite input key embedded in the output file name.
 *
 * @param {ShellCssAsset} asset - Rollup output asset from `generateBundle`.
 * @returns {boolean} True when this asset is the shell CSS.
 */
function isShellCssAsset(asset: ShellCssAsset): boolean {
  if (!asset.fileName.endsWith('.css')) {
    return false;
  }

  // CSS-only entry keeps the input key in the hashed file name (shell-*.css).
  if (/(?:^|\/)shell[^/]*\.css$/.test(asset.fileName)) {
    return true;
  }

  const originals = asset.originalFileNames ?? [];

  return originals.some(
    (name) =>
      name.includes('src/web/ui/styles/shell.scss') ||
      name.includes('src/web/ui/styles.css') ||
      name.includes('src/web/ui/styles/shell.scss') ||
      name.includes('src/web/styles.css'),
  );
}

/**
 * Narrows a bundle entry to a CSS asset candidate.
 *
 * @param {unknown} output - Rollup chunk or asset.
 * @returns {output is ShellCssAsset} True when the entry is an asset with CSS fields.
 */
function isCssAssetCandidate(output: unknown): output is ShellCssAsset {
  if (typeof output !== 'object' || output === null) {
    return false;
  }

  if (!('type' in output) || output.type !== 'asset') {
    return false;
  }

  if (!('fileName' in output) || typeof output.fileName !== 'string') {
    return false;
  }

  return 'source' in output;
}

/**
 * Finds the shell CSS asset in a Rollup bundle, when present.
 *
 * @param {ShellCssBundle} bundle - Rollup output bundle.
 * @returns {ShellCssAsset | undefined} The shell stylesheet asset.
 */
function findShellCssAsset(bundle: ShellCssBundle): ShellCssAsset | undefined {
  for (const output of Object.values(bundle)) {
    if (isCssAssetCandidate(output) && isShellCssAsset(output)) {
      return output;
    }
  }

  return undefined;
}

/**
 * Turns an asset source into a UTF-8 string for size measurement.
 *
 * @param {string | Uint8Array} source - Rollup asset source.
 * @returns {string} CSS text.
 */
function assetSourceToString(source: string | Uint8Array): string {
  if (typeof source === 'string') {
    return source;
  }

  return Buffer.from(source).toString('utf8');
}

/**
 * Reports the shell CSS raw and gzip sizes against the configured budget.
 *
 * Logs only; never fails the build (emergency CSS must not be blocked).
 * Hard fail-on-exceed via size-limit is tracked separately as tech debt.
 *
 * @returns {Plugin} Vite plugin for the client build.
 */
export function shellCssBudgetPlugin(): Plugin {
  return {
    name: 'shell-css-budget',
    generateBundle(_options, bundle): void {
      const asset = findShellCssAsset(bundle as unknown as ShellCssBundle);

      if (!asset) {
        // SSR or incomplete client graph — nothing to audit.
        return;
      }

      const css = assetSourceToString(asset.source);
      const rawBytes = Buffer.byteLength(css, 'utf8');
      const gzipBytes = gzipSync(css).byteLength;
      const budget = shellCssBudgetBytes();
      const over = gzipBytes > budget;
      const status = over ? 'OVER budget' : 'within budget';

      // Report-only: always log so CI and local builds surface the audit.
      console.info(
        `[shell-css-budget] ${asset.fileName}: raw=${rawBytes} B, gzip=${gzipBytes} B, budget=${budget} B (${status})`,
      );
    },
  };
}
