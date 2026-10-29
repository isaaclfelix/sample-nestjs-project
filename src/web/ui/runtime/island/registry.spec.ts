import { islandCssModuleUrl, islandLoaders, isIslandName } from './registry';

describe('island registry', () => {
  it('recognizes registered island names', () => {
    expect(isIslandName('mobile-navigation')).toBe(true);
    expect(isIslandName('login-form')).toBe(true);
    expect(isIslandName('register-form')).toBe(true);
    expect(isIslandName('logout-button')).toBe(true);
    expect(isIslandName('chart')).toBe(false);
    expect(isIslandName('toString')).toBe(false);
  });

  it('returns the Vite CSS module URL for registered islands', () => {
    expect(islandCssModuleUrl('mobile-navigation')).toBe(
      '/src/web/ui/islands/mobile-navigation.module.scss',
    );
    expect(islandCssModuleUrl('login-form')).toBeUndefined();
    expect(islandCssModuleUrl('register-form')).toBeUndefined();
    expect(islandCssModuleUrl('logout-button')).toBeUndefined();
  });

  it('lazy-loads each registered island module', async () => {
    await expect(islandLoaders['mobile-navigation']()).resolves.toMatchObject({
      default: expect.any(Function),
    });
    await expect(islandLoaders['login-form']()).resolves.toMatchObject({
      default: expect.any(Function),
    });
    await expect(islandLoaders['register-form']()).resolves.toMatchObject({
      default: expect.any(Function),
    });
    await expect(islandLoaders['logout-button']()).resolves.toMatchObject({
      default: expect.any(Function),
    });
  });
});
