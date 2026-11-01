import { afterEach, describe, expect, it, vi } from 'vitest';
import { getArchipielagoPaths } from '@archipielago/core/paths.js';
import { getViteDevServer, setViteDevServer } from './page-loader.js';

vi.mock('vite', () => ({
  createServer: vi.fn(async () => ({
    middlewares: vi.fn(),
    ssrLoadModule: vi.fn(),
    transformRequest: vi.fn(),
  })),
}));

describe('asset pipeline', () => {
  afterEach(() => {
    setViteDevServer(undefined);
    vi.clearAllMocks();
  });

  it('createDevAssetPipeline registers vite and returns mountables', async () => {
    const { createDevAssetPipeline } = await import('./asset-pipeline.js');
    const { createServer } = await import('vite');

    const pipeline = await createDevAssetPipeline();

    expect(createServer).toHaveBeenCalledWith({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    expect(getViteDevServer()).toBe(pipeline.vite);
    expect(pipeline.middlewares).toBe(pipeline.vite.middlewares);
    expect(pipeline.clientOutDir).toContain(
      getArchipielagoPaths().clientOutDirRel,
    );
  });

  it('clientAssetsRoot uses configured client out dir', async () => {
    const { clientAssetsRoot } = await import('./asset-pipeline.js');
    expect(clientAssetsRoot()).toContain(
      getArchipielagoPaths().clientOutDirRel,
    );
  });
});
