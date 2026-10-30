import { describe, expect, it } from 'vitest';
import { islandNameFromGlobKey } from './island-glob-key';

describe('islandNameFromGlobKey', () => {
  it('accepts conventional dirname===basename keys', () => {
    expect(
      islandNameFromGlobKey(
        '../../islands/mobile-navigation/mobile-navigation.tsx',
      ),
    ).toBe('mobile-navigation');
  });

  it('rejects non-island paths and mismatched file names', () => {
    expect(islandNameFromGlobKey('../../pages/home/home.tsx')).toBeUndefined();
    expect(
      islandNameFromGlobKey('../../islands/mobile-navigation/helper.tsx'),
    ).toBeUndefined();
    expect(
      islandNameFromGlobKey(
        '../../islands/mobile-navigation/mobile-navigation.stories.tsx',
      ),
    ).toBeUndefined();
  });
});
