import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Client and server builds for the React page layer.
 *
 * `vite build` emits the browser hydrate entry and its lazy island chunks.
 * `vite build --ssr` emits the Node render bundle. `nest build` still owns
 * the API. Island chunks stay dynamic imports so a page does not download
 * components it did not render.
 */
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  build: isSsrBuild
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
          input: 'src/web/client/hydrate.tsx',
        },
      },
}));
