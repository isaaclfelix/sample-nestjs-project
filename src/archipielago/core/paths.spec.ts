import { afterEach, describe, expect, it } from 'vitest';
import {
  defaultArchipielagoPaths,
  getArchipielagoPaths,
  setArchipielagoPaths,
} from './paths.js';

describe('ArchipielagoPaths', () => {
  afterEach(() => {
    setArchipielagoPaths(undefined);
  });

  it('starts from repository defaults', () => {
    expect(getArchipielagoPaths()).toEqual(defaultArchipielagoPaths);
  });

  it('merges overrides and restores defaults', () => {
    setArchipielagoPaths({ clientOutDirRel: 'tmp/client' });
    expect(getArchipielagoPaths().clientOutDirRel).toBe('tmp/client');
    expect(getArchipielagoPaths().hydrateEntrySource).toBe(
      defaultArchipielagoPaths.hydrateEntrySource,
    );

    setArchipielagoPaths(undefined);
    expect(getArchipielagoPaths()).toEqual(defaultArchipielagoPaths);
  });
});
