import { decodeIslandProps, encodeIslandProps } from './island-props';

describe('island props', () => {
  it('round-trips a props object', () => {
    const props = { start: 0, note: '<b>"' };
    const encoded = encodeIslandProps(props);

    expect(encoded).not.toContain('<');
    expect(encoded).not.toContain('"');
    expect(decodeIslandProps(encoded)).toEqual(props);
  });

  it('rejects JSON that is not an object', () => {
    const encodedNull = encodeURIComponent('null');
    const encodedArray = encodeURIComponent('[1]');
    const encodedString = encodeURIComponent('"nope"');

    expect(() => decodeIslandProps(encodedNull)).toThrow(
      'Island props must be a JSON object.',
    );
    expect(() => decodeIslandProps(encodedArray)).toThrow(
      'Island props must be a JSON object.',
    );
    expect(() => decodeIslandProps(encodedString)).toThrow(
      'Island props must be a JSON object.',
    );
  });
});
