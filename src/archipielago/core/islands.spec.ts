import { afterEach, describe, expect, it } from 'vitest';
import { islands as appIslands } from '../../web/protocol/islands.generated.js';
import {
  getIslands,
  islandCssModulePath,
  islandCssModuleUrl,
  islandEntryRelPath,
  islandManifestSourceKey,
  isIslandName,
  registerIslands,
} from './islands.js';

describe('Archipielago islands helpers', () => {
  afterEach(() => {
    registerIslands(appIslands);
  });

  it('builds concrete entry and CSS module paths', () => {
    expect(islandEntryRelPath('mobile-navigation')).toBe(
      'src/web/ui/islands/mobile-navigation/mobile-navigation.tsx',
    );
    expect(islandCssModulePath('mobile-navigation')).toBe(
      '/src/web/ui/islands/mobile-navigation/mobile-navigation.module.scss',
    );
    expect(islandManifestSourceKey('mobile-navigation')).toBe(
      islandEntryRelPath('mobile-navigation'),
    );
  });

  it('returns CSS module URLs only when hasCssModule is true', () => {
    expect(islandCssModuleUrl('mobile-navigation')).toBe(
      islandCssModulePath('mobile-navigation'),
    );
    expect(islandCssModuleUrl('login-form')).toBeUndefined();
  });

  it('recognizes injected table keys only', () => {
    for (const name of Object.keys(getIslands())) {
      expect(isIslandName(name)).toBe(true);
    }
    expect(isIslandName('toString')).toBe(false);
    expect(isIslandName('missing')).toBe(false);
  });

  it('clears registration when undefined is passed', () => {
    registerIslands(undefined);
    expect(getIslands()).toEqual({});
    expect(isIslandName('mobile-navigation')).toBe(false);
  });
});
