import {
  clientAssetsRoot,
  createDevAssetPipeline,
} from '@archipielago/vite/asset-pipeline.js';

/**
 * Minimum Nest Express surface needed to mount Archipielago assets.
 */
export interface ArchipielagoAssetHost {
  /** Mounts one Connect-compatible middleware. */
  use(middleware: unknown): unknown;
  /** Mounts a static directory without serving its index file. */
  useStaticAssets(
    path: string,
    options: { index: false },
  ): ArchipielagoAssetHost;
}

/**
 * Mounts production static assets or development Vite middleware.
 *
 * Call once during Nest bootstrap, after creating the app and before listen.
 * Vite registration remains shared with the renderer through the Vite package.
 *
 * @param {ArchipielagoAssetHost} app - Nest Express application to configure.
 * @param {{ production?: boolean }} options - Optional explicit environment mode.
 * @returns {Promise<void>} Resolves after the selected asset pipeline is mounted.
 */
export async function mountArchipielagoAssets(
  app: ArchipielagoAssetHost,
  options: { production?: boolean } = {},
): Promise<void> {
  const production =
    options.production ?? process.env.NODE_ENV === 'production';

  // Production serves the built client directory without a fallback index.
  if (production) {
    app.useStaticAssets(clientAssetsRoot(), { index: false });
    return;
  }

  // Development mounts Vite middleware and registers its SSR server globally.
  const pipeline = await createDevAssetPipeline();
  app.use(pipeline.middlewares);
}
