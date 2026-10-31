import { join } from 'node:path';
import { createServer, type ViteDevServer } from 'vite';
import { getArchipielagoPaths } from '../core/paths.js';
import { setViteDevServer } from './page-loader.js';

/**
 * Mountables returned by {@link createDevAssetPipeline}.
 *
 * Hosts (Nest, Express, …) mount `middlewares` themselves. Archipielago does
 * not call `app.use` or import Nest/Express types.
 */
export interface DevAssetPipeline {
  /** Middleware-mode Vite server (also registered for SSR/`transformRequest`). */
  vite: ViteDevServer;
  /** Connect-style middleware from Vite (`vite.middlewares`). */
  middlewares: ViteDevServer['middlewares'];
  /** Absolute client output directory for production static mounts. */
  clientOutDir: string;
}

/**
 * Creates the Vite middleware-mode asset pipeline for development SSR.
 *
 * Registers the server via {@link setViteDevServer} so page loaders and island
 * CSS transforms share one process-global handle (Phase 1 tradeoff).
 *
 * @returns {Promise<DevAssetPipeline>} Vite server, middleware, and client out dir.
 */
export async function createDevAssetPipeline(): Promise<DevAssetPipeline> {
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  setViteDevServer(vite);

  return {
    vite,
    middlewares: vite.middlewares,
    clientOutDir: join(process.cwd(), getArchipielagoPaths().clientOutDirRel),
  };
}

/**
 * Absolute path of the production client asset directory.
 *
 * Hosts mount this with their static-file middleware (e.g. Nest
 * `useStaticAssets`). Archipielago only exposes the path.
 *
 * @returns {string} Absolute `clientOutDir` from active path config.
 */
export function clientAssetsRoot(): string {
  return join(process.cwd(), getArchipielagoPaths().clientOutDirRel);
}
