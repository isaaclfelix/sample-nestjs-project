import {
  islandNameFromCssModuleId,
  rewriteIslandCssClientInject,
} from './vite-suppress-island-css-inject.js';

describe('islandNameFromCssModuleId', () => {
  it('parses island module paths', () => {
    expect(
      islandNameFromCssModuleId(
        '/home/app/src/web/ui/islands/mobile-navigation/mobile-navigation.module.scss',
      ),
    ).toBe('mobile-navigation');
    expect(
      islandNameFromCssModuleId(
        '/home/app/src/web/ui/islands/my-widget/my-widget.module.css?used',
      ),
    ).toBe('my-widget');
  });

  it('ignores non-island stylesheets', () => {
    expect(
      islandNameFromCssModuleId('/home/app/src/web/ui/styles/shell.scss'),
    ).toBeUndefined();
  });
});

describe('rewriteIslandCssClientInject', () => {
  const sample = `import { updateStyle as __vite__updateStyle, removeStyle as __vite__removeStyle } from "/@vite/client"
const __vite__id = "/src/web/ui/islands/mobile-navigation/mobile-navigation.module.scss"
const __vite__css = "._count{font-weight:700}"
__vite__updateStyle(__vite__id, __vite__css)
export default { count: "_count" };
import.meta.hot.prune(() => __vite__removeStyle(__vite__id))
`;

  it('routes updateStyle and removeStyle through the sibling tag', () => {
    const next = rewriteIslandCssClientInject(sample, 'mobile-navigation');
    expect(next).toContain('data-css-island-hmr');
    expect(next).toContain(
      'document.querySelector("style[data-css-island=\\"mobile-navigation\\"]")',
    );
    expect(next).toContain('el.textContent = $css');
    expect(next).toContain('__vite__removeStyle($id)');
    // Defensive ASI: IIFE must not run as a call on the preceding CSS string.
    expect(next).toMatch(/const __vite__css = [^\n]+\n;?\(\(\$id, \$css\) =>/);
    expect(next).toContain(';(($id, $css) => { /* data-css-island-hmr */');
  });

  it('is idempotent', () => {
    const once = rewriteIslandCssClientInject(sample, 'mobile-navigation');
    expect(rewriteIslandCssClientInject(once, 'mobile-navigation')).toBe(once);
  });
});
