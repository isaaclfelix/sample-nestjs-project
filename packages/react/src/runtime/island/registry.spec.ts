import { getIslands, isIslandName } from '@archipielago/core/islands';
import {
  getIslandLoaders,
  resetIslandLoadersCache,
  resetIslandModules,
  setIslandModules,
} from './registry';
import type { IslandModule } from './island-module';

describe('island registry', () => {
  it('recognizes injected island names only', () => {
    for (const name of Object.keys(getIslands())) {
      expect(isIslandName(name)).toBe(true);
    }
    expect(isIslandName('chart')).toBe(false);
    expect(isIslandName('toString')).toBe(false);
  });

  it('keeps loaders in sync with the injected islands manifest', () => {
    expect(Object.keys(getIslandLoaders()).sort()).toEqual(
      Object.keys(getIslands()).sort(),
    );
  });

  it('exposes a lazy loader function per registered island', () => {
    // Do not invoke loaders here — that boots product island modules (e2e / TD-033).
    const loaders = getIslandLoaders();
    for (const name of Object.keys(getIslands())) {
      expect(loaders[name]).toBeTypeOf('function');
    }
  });

  it('requires setIslandModules before building loaders', () => {
    const previous = getIslandLoaders();
    resetIslandModules();
    expect(() => getIslandLoaders()).toThrow(/setIslandModules/);
    // Restore the Vitest setup glob so later specs keep working.
    setIslandModules(
      Object.fromEntries(
        Object.keys(previous).map((name) => [
          `../../islands/${name}/${name}.tsx`,
          async (): Promise<IslandModule> => ({ default: () => null }),
        ]),
      ),
    );
    resetIslandLoadersCache();
  });
});
