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

  it('lazy-loads each registered island module', async () => {
    const loaders = getIslandLoaders();
    for (const name of Object.keys(getIslands())) {
      const load = loaders[name];
      expect(load).toBeTypeOf('function');
      await expect(load!()).resolves.toMatchObject({
        default: expect.any(Function),
      });
    }
  });
});
