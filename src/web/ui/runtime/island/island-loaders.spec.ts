import { describe, expect, it } from 'vitest';
import {
  assertIslandLoadersComplete,
  buildIslandLoaders,
} from './island-loaders';
import type { IslandModule } from './island-module';

describe('buildIslandLoaders', () => {
  it('keeps conventional registered keys and drops others', () => {
    const loadNav = async (): Promise<IslandModule> => ({
      default: () => null,
    });
    const loadOther = async (): Promise<IslandModule> => ({
      default: () => null,
    });

    const loaders = buildIslandLoaders(
      {
        '../../islands/nav/nav.tsx': loadNav,
        '../../islands/nav/helper.tsx': loadOther,
        '../../islands/ghost/ghost.tsx': loadOther,
        '../../pages/x/x.tsx': loadOther,
      },
      (name) => name === 'nav',
    );

    expect(Object.keys(loaders)).toEqual(['nav']);
    expect(loaders.nav).toBe(loadNav);
  });
});

describe('assertIslandLoadersComplete', () => {
  it('passes when every name has a loader', () => {
    expect(() =>
      assertIslandLoadersComplete(['login-form'], {
        'login-form': async () => ({ default: () => null }),
      }),
    ).not.toThrow();
  });

  it('throws when a protocol name is missing a loader', () => {
    expect(() => assertIslandLoadersComplete(['login-form'], {})).toThrow(
      /login-form/,
    );
  });
});
