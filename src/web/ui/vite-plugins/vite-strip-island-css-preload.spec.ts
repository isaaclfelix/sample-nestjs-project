import { stripCssAssetPathsFromCode } from './vite-strip-island-css-preload';

describe('stripCssAssetPathsFromCode', () => {
  const input =
    'const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/mobile-navigation.js","assets/react.js","assets/mobile-navigation.css"])))=>i.map(i=>d[i]);' +
    '__vite__mapDeps([0,1,2]);' +
    'const other="keep.css";';

  it('filters css URLs from mapDeps results without dropping table entries', () => {
    const out = stripCssAssetPathsFromCode(input);

    // Table keeps the css path so indices in __vite__mapDeps([0,1,2]) stay valid.
    expect(out).toContain(
      '["assets/mobile-navigation.js","assets/react.js","assets/mobile-navigation.css"]',
    );
    expect(out).toContain(
      '.filter((u)=>/*strip-island-css*/typeof u=="string"',
    );
    expect(out).toContain('!u.endsWith(".css")');
    expect(out).toContain('__vite__mapDeps([0,1,2])');
    expect(out).toContain('keep.css');
  });

  it('is idempotent', () => {
    const once = stripCssAssetPathsFromCode(input);
    expect(stripCssAssetPathsFromCode(once)).toBe(once);
  });

  it('leaves chunks without mapDeps unchanged', () => {
    expect(stripCssAssetPathsFromCode('const x="assets/x.css";')).toBe(
      'const x="assets/x.css";',
    );
  });
});
