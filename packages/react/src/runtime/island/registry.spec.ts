import { registerIslands } from '@archipielago/core/islands';
import {
  getIslandLoaders,
  isIslandName,
  resetIslandLoadersCache,
  resetIslandModules,
  setIslandModules,
} from './registry';
import type { IslandModule } from './island-module';

/**
 * Installs a two-island fixture and matching conventional glob loaders.
 *
 * @returns {void}
 */
function installFixtureIslands(): void {
  registerIslands({
    'login-form': { hasCssModule: false },
    'toggle-stub': { hasCssModule: false },
  });
  setIslandModules({
    '../../islands/login-form/login-form.tsx':
      async (): Promise<IslandModule> => ({
        default: () => null,
      }),
    '../../islands/toggle-stub/toggle-stub.tsx':
      async (): Promise<IslandModule> => ({
        default: () => null,
      }),
  });
  resetIslandLoadersCache();
}

describe('island registry', () => {
  beforeEach(() => {
    installFixtureIslands();
  });

  afterEach(() => {
    registerIslands(undefined);
    resetIslandModules();
  });

  it('recognizes injected island names only', () => {
    expect(isIslandName('login-form')).toBe(true);
    expect(isIslandName('toggle-stub')).toBe(true);
    expect(isIslandName('chart')).toBe(false);
    expect(isIslandName('toString')).toBe(false);
  });

  it('keeps loaders in sync with the injected islands manifest', () => {
    expect(Object.keys(getIslandLoaders()).sort()).toEqual([
      'login-form',
      'toggle-stub',
    ]);
  });

  it('exposes a lazy loader function per registered island', () => {
    // Do not invoke loaders here — that would boot real modules (e2e / TD-033).
    const loaders = getIslandLoaders();
    expect(loaders['login-form']).toBeTypeOf('function');
    expect(loaders['toggle-stub']).toBeTypeOf('function');
  });

  it('requires setIslandModules before building loaders', () => {
    resetIslandModules();
    expect(() => getIslandLoaders()).toThrow(/setIslandModules/);
    // Restore fixture loaders so later specs in this file keep working.
    installFixtureIslands();
  });
});
