import react from '@vitejs/plugin-react';
import doiuse from 'doiuse';
import sortMediaQueries from 'postcss-sort-media-queries';
import { defineConfig } from 'vite';
import { shellCssBudgetPlugin } from './src/web/vite-shell-css-budget.js';
import { stripIslandCssFromModulePreload } from './src/web/vite-strip-island-css-preload.js';
import { suppressIslandCssClientInject } from './src/web/vite-suppress-island-css-inject.js';

/**
 * Client and server builds for the React page layer.
 *
 * `vite build` emits the browser hydrate entry and its lazy island chunks.
 * `vite build --ssr` emits the Node render bundle. `nest build` still owns
 * the API. Island chunks stay dynamic imports so a page does not download
 * components it did not render.
 *
 * CSS: Sass → PostCSS (media-query sort + doiuse warn) → Lightning CSS minify
 * at Baseline Widely Available. The shell sheet is its own client input.
 */
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    react(),
    // Dev: island CSS stays on SSR sibling <style>; do not also inject head tags.
    suppressIslandCssClientInject(),
    ...(isSsrBuild
      ? []
      : [shellCssBudgetPlugin(), stripIslandCssFromModulePreload()]),
  ],
  build: {
    // Lean modern evergreen targets; older browsers are TD-013 / TD-015.
    target: 'baseline-widely-available',
    cssMinify: 'lightningcss',
    ...(isSsrBuild
      ? {
          outDir: 'dist/web-server',
          emptyOutDir: false,
          ssr: true,
          rollupOptions: {
            input: 'src/web/entry-server.tsx',
          },
        }
      : {
          outDir: 'dist/client',
          emptyOutDir: false,
          manifest: true,
          rollupOptions: {
            input: {
              hydrate: 'src/web/client/hydrate.tsx',
              shell: 'src/web/styles.scss',
            },
          },
        }),
  },
  css: {
    postcss: {
      plugins: [
        sortMediaQueries({ sort: 'mobile-first' }),
        doiuse({
          browsers: ['baseline widely available'],
          onFeatureUsage(usageInfo: { message: string }): void {
            // Warn-only: never fail the build for caniuse findings.
            console.warn(`[doiuse] ${usageInfo.message}`);
          },
        }),
      ],
    },
  },
}));
