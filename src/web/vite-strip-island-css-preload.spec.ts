import { stripCssAssetPathsFromCode } from './vite-strip-island-css-preload.js';

describe('stripCssAssetPathsFromCode', () => {
  it('removes css paths from the vite __vite__mapDeps table only', () => {
    const input =
      'const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/counter.js","assets/react.js","assets/counter.css"])))=>i.map(i=>d[i]);' +
      'const other="keep.css";';

    const out = stripCssAssetPathsFromCode(input);

    expect(out).toContain('["assets/counter.js","assets/react.js"]');
    expect(out).not.toContain('assets/counter.css');
    expect(out).toContain('keep.css');
  });
});
