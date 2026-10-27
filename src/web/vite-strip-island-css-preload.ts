import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

/**
 * Marker so the rewrite is idempotent if writeBundle runs twice.
 */
const cssFilterMarker = '/*strip-island-css*/';

/**
 * Makes `__vite__mapDeps` omit `.css` URLs without shifting table indices.
 *
 * Vite emits `m.f=["island.js","react.js","island.css"]` and calls
 * `__vite__mapDeps([0,1,2])`. Removing the CSS string from `m.f` leaves index
 * `2` as `undefined`, which becomes
 * `<link rel="modulepreload" href="…/undefined">`. Filtering after the map
 * keeps indices stable and still prevents a second stylesheet inject (island
 * CSS is already SSR-inlined).
 *
 * Must not strip arbitrary `.css` substrings from the hydrate chunk — that
 * file also embeds React DOM, which mentions stylesheets in source text.
 *
 * @param {string} code - Hydrate chunk source.
 * @returns {string} Source whose mapDeps helper skips CSS URLs.
 */
export function stripCssAssetPathsFromCode(code: string): string {
  if (code.includes(cssFilterMarker)) {
    return code;
  }

  return code.replace(
    /(__vite__mapDeps=\(i,m=__vite__mapDeps,d=\(m\.f\|\|\(m\.f=\[[^\]]*\]\)\)\)=>)i\.map\(i=>d\[i\]\)/g,
    `$1i.map(i=>d[i]).filter((u)=>${cssFilterMarker}typeof u=="string"&&!u.endsWith(".css"))`,
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
