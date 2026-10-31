import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  applyArchipielagoUserConfig,
  defaultArchipielagoResolvedConfig,
  getArchipielagoConfig,
  getIslandsRegistration,
  loadAndApplyArchipielagoConfig,
  manualIslandManifestWarning,
  resetArchipielagoConfig,
} from './config.js';
import { defaultArchipielagoPaths } from './paths.js';

const tempDirs: string[] = [];

afterEach(async () => {
  resetArchipielagoConfig();
  const { rm } = await import('node:fs/promises');
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe('Archipielago config', () => {
  it('defaults to filesystem registration and sample paths', () => {
    expect(getArchipielagoConfig()).toEqual(
      defaultArchipielagoResolvedConfig(),
    );
    expect(getIslandsRegistration()).toBe('filesystem');
  });

  it('applies registration and path overrides', () => {
    applyArchipielagoUserConfig({
      islands: { registration: 'manifest' },
      paths: { islandsGeneratedRel: 'app/islands.ts' },
    });
    expect(getIslandsRegistration()).toBe('manifest');
    expect(getArchipielagoConfig().paths.islandsGeneratedRel).toBe(
      'app/islands.ts',
    );
    expect(getArchipielagoConfig().paths.islandsDirRel).toBe(
      defaultArchipielagoPaths.islandsDirRel,
    );
  });

  it('loads archipielago.config.ts from a repo root', async () => {
    const root = await mkdtemp(join(tmpdir(), 'arch-config-'));
    tempDirs.push(root);
    await writeFile(
      join(root, 'archipielago.config.ts'),
      `export default {
  islands: { registration: 'manifest' },
  paths: { islandsGeneratedRel: 'custom/islands-map.ts' },
};
`,
      'utf8',
    );

    const resolved = await loadAndApplyArchipielagoConfig(root);
    expect(resolved.islandsRegistration).toBe('manifest');
    expect(resolved.paths.islandsGeneratedRel).toBe('custom/islands-map.ts');
  });

  it('resets when the config file is missing', async () => {
    applyArchipielagoUserConfig({
      islands: { registration: 'manifest' },
    });
    const root = await mkdtemp(join(tmpdir(), 'arch-config-empty-'));
    tempDirs.push(root);
    await mkdir(root, { recursive: true });

    const resolved = await loadAndApplyArchipielagoConfig(root);
    expect(resolved.islandsRegistration).toBe('filesystem');
    expect(resolved.paths).toEqual(defaultArchipielagoPaths);
  });

  it('formats a manual-mode manifest warning', () => {
    expect(
      manualIslandManifestWarning('toggle', true, 'src/web/protocol/map.ts'),
    ).toContain('src/web/protocol/map.ts');
    expect(
      manualIslandManifestWarning('toggle', true, 'src/web/protocol/map.ts'),
    ).toContain("'toggle': { hasCssModule: true }");
  });
});
