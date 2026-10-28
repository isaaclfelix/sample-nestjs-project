import { emptyAssetTags } from './asset-tags.js';
import {
  getViteDevServer,
  loadServerEntry,
  setViteDevServer,
  type ServerEntry,
  type ServerEntryLoader,
} from './page-loader.js';
import type { PageAssets } from './page-assets.js';

describe('page loader', () => {
  afterEach(() => {
    setViteDevServer(undefined);
  });

  it('stores and clears the vite dev server', () => {
    const server = {
      ssrLoadModule: vi.fn(),
    } as ServerEntryLoader;

    setViteDevServer(server);

    expect(getViteDevServer()).toBe(server);

    setViteDevServer(undefined);

    expect(getViteDevServer()).toBeUndefined();
  });

  it('loads the entry through vite when a dev server is registered', async () => {
    const entry = { render: vi.fn() } as ServerEntry;
    const ssrLoadModule = vi.fn().mockResolvedValue(entry);
    const vite: ServerEntryLoader = { ssrLoadModule };
    const load = vi.fn();

    await expect(loadServerEntry({ vite, vitest: false }, load)).resolves.toBe(
      entry,
    );
    expect(ssrLoadModule).toHaveBeenCalledWith('/src/web/entry-server.tsx');
    expect(load).not.toHaveBeenCalled();
  });

  it('points vitest at the TSX source', async () => {
    const load = vi.fn().mockResolvedValue({ render: vi.fn() });

    await loadServerEntry({ vitest: true }, load);

    expect(String(load.mock.calls[0][0])).toContain('entry-server.tsx');
  });

  it('points production at the built server bundle', async () => {
    const load = vi.fn().mockResolvedValue({ render: vi.fn() });

    await loadServerEntry({ vitest: false }, load);

    expect(String(load.mock.calls[0][0])).toContain(
      'dist/web-server/entry-server.js',
    );
  });

  it('imports the source entry when no loader is injected', async () => {
    const entry = await loadServerEntry({ vitest: true });
    const assets: PageAssets = { tags: emptyAssetTags, islandCss: {} };
    const html = await entry.render(
      'home',
      { renderedAt: '2026-10-22T12:00:00.000Z' },
      () => assets,
    );

    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain(
      'Rendered on the server at 2026-10-22T12:00:00.000Z.',
    );
    expect(html).toContain('data-island="counter"');
  });
});
