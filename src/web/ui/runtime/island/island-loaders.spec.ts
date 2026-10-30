import { describe, expect, it } from 'vitest';
import {
  assertIslandLoadersComplete,
  buildIslandLoaders,
} from './island-loaders';
import type { IslandModule } from './island-module';

describe('buildIslandLoaders', () => {
  it('keeps conventional registered keys and drops others', () => {
    const loadLogin = async (): Promise<IslandModule> => ({
      default: () => null,
    });
    const loadOther = async (): Promise<IslandModule> => ({
      default: () => null,
    });

    // Use a real IslandName path so the Partial<Record<IslandName, …>> result types cleanly.
    const loaders = buildIslandLoaders(
      {
        '../../islands/login-form/login-form.tsx': loadLogin,
        '../../islands/login-form/helper.tsx': loadOther,
        '../../islands/ghost/ghost.tsx': loadOther,
        '../../pages/x/x.tsx': loadOther,
      },
      (name) => name === 'login-form',
    );

    expect(Object.keys(loaders)).toEqual(['login-form']);
    expect(loaders['login-form']).toBe(loadLogin);
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
