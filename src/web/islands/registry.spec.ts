import { islandCssModuleUrl, isIslandName } from './registry.js';

describe('island registry', () => {
  it('recognizes registered island names', () => {
    expect(isIslandName('mobile-navigation')).toBe(true);
    expect(isIslandName('chart')).toBe(false);
    expect(isIslandName('toString')).toBe(false);
  });

  it('returns the Vite CSS module URL for registered islands', () => {
    expect(islandCssModuleUrl('mobile-navigation')).toBe(
      '/src/web/islands/mobile-navigation.module.scss',
    );
  });
});
