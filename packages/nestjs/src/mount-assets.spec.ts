import {
  clientAssetsRoot,
  createDevAssetPipeline,
} from '@archipielago/vite/asset-pipeline.js';
import { ArchipielagoModule } from './archipielago.module.js';
import {
  ARCHIPIELAGO_NEST_OPTIONS,
  type ArchipielagoNestOptions,
} from './archipielago-nest.options.js';
import { ArchipielagoViewService } from './archipielago-view.service.js';
import {
  mountArchipielagoAssets,
  type ArchipielagoAssetHost,
} from './mount-assets.js';

vi.mock('@archipielago/vite/asset-pipeline.js', () => ({
  clientAssetsRoot: vi.fn(() => '/built/client'),
  createDevAssetPipeline: vi.fn(async () => ({
    middlewares: 'vite-middleware',
  })),
}));

describe('ArchipielagoModule', () => {
  it('exports the renderer with host options', () => {
    const options: ArchipielagoNestOptions = {
      getPageStylesheets: () => ['forms'],
    };

    const module = ArchipielagoModule.forRoot(options);

    expect(module.exports).toContain(ArchipielagoViewService);
    expect(module.providers).toContain(ArchipielagoViewService);
    expect(module.providers).toContainEqual({
      provide: ARCHIPIELAGO_NEST_OPTIONS,
      useValue: options,
    });
  });
});

describe('mountArchipielagoAssets', () => {
  it('mounts the built client directory in production', async () => {
    const app = {
      use: vi.fn(),
      useStaticAssets: vi.fn().mockReturnThis(),
    } satisfies ArchipielagoAssetHost;

    await mountArchipielagoAssets(app, { production: true });

    expect(clientAssetsRoot).toHaveBeenCalledOnce();
    expect(app.useStaticAssets).toHaveBeenCalledWith('/built/client', {
      index: false,
    });
    expect(app.use).not.toHaveBeenCalled();
  });

  it('mounts Vite middleware in development', async () => {
    const app = {
      use: vi.fn(),
      useStaticAssets: vi.fn().mockReturnThis(),
    } satisfies ArchipielagoAssetHost;

    await mountArchipielagoAssets(app, { production: false });

    expect(createDevAssetPipeline).toHaveBeenCalledOnce();
    expect(app.use).toHaveBeenCalledWith('vite-middleware');
    expect(app.useStaticAssets).not.toHaveBeenCalled();
  });
});
