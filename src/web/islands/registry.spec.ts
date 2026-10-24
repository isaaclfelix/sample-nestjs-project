import { isIslandName } from './registry.js';

describe('island registry', () => {
  it('recognizes registered island names', () => {
    expect(isIslandName('counter')).toBe(true);
    expect(isIslandName('chart')).toBe(false);
    expect(isIslandName('toString')).toBe(false);
  });
});
