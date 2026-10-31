import { getIslands, isIslandName } from '@archipielago/core/islands';
import { getIslandLoaders } from './registry';

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
});
