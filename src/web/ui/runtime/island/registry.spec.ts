import { islands } from '@protocol/islands';
import { islandLoaders, isIslandName } from './registry';

describe('island registry', () => {
  it('recognizes generated protocol island names only', () => {
    for (const name of Object.keys(islands)) {
      expect(isIslandName(name)).toBe(true);
    }
    expect(isIslandName('chart')).toBe(false);
    expect(isIslandName('toString')).toBe(false);
  });

  it('keeps loaders in sync with the protocol islands table', () => {
    expect(Object.keys(islandLoaders).sort()).toEqual(
      Object.keys(islands).sort(),
    );
  });

  it('lazy-loads each registered island module', async () => {
    for (const name of Object.keys(islands) as (keyof typeof islands)[]) {
      await expect(islandLoaders[name]()).resolves.toMatchObject({
        default: expect.any(Function),
      });
    }
  });
});
