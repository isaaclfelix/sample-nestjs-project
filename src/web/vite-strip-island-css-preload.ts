import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

/**
 * Removes `.css` entries from Vite's `__vite__mapDeps` preload table only.
 *
 * Must not strip arbitrary `.css` substrings from the hydrate chunk — that
 * file also embeds React DOM, which mentions stylesheets in source text.
 *
 * @param {string} code - Hydrate chunk source.
 * @returns {string} Source with CSS paths removed from mapDeps.
 */
export function stripCssAssetPathsFromCode(code: string): string {
  return code.replace(
    /(__vite__mapDeps=\(i,m=__vite__mapDeps,d=\(m\.f\|\|\(m\.f=)(\[[^\]]*\])/g,
    (_full, prefix: string, arrayLiteral: string) => {
      const cleaned = arrayLiteral
        .replace(/,?\s*["'][^"']+\.css["']/g, '')
        .replace(/\[\s*,/g, '[')
        .replace(/,\s*\]/g, ']');
      return `${prefix}${cleaned}`;
    },
  );
}

/**
 * Removes island CSS file references from Vite's client preload dependency map.
 *
 * Island CSS is SSR-inlined as sibling `<style>` tags. Leaving those paths in
 * `__vite__mapDeps` would inject a second copy when the island JS loads.
 *
 * Rewrites the hydrate file on disk after emit because Vite 8 / Rolldown may
 * not honor `renderChunk` / `modulePreload.resolveDependencies` for this map.
 *
 * @returns {Plugin} Vite client-build plugin.
 */
export function stripIslandCssFromModulePreload(): Plugin {
  return {
    name: 'strip-island-css-from-module-preload',
    apply: 'build',
    enforce: 'post',
    writeBundle(options, bundle): void {
      const outDir = options.dir ?? 'dist/client';

      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk' || !output.fileName.includes('hydrate')) {
          continue;
        }

        const filePath = join(outDir, output.fileName);
        const code = readFileSync(filePath, 'utf8');

        if (!code.includes('__vite__mapDeps')) {
          continue;
        }

        const next = stripCssAssetPathsFromCode(code);

        if (next !== code) {
          writeFileSync(filePath, next);
        }
      }
    },
  };
}
