import { createElement, Fragment, type ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import {
  Island,
  IslandCssContext,
  type IslandCssContextValue,
} from './island.js';

/**
 * Minimal island body for SSR style-tag tests.
 *
 * @returns {ReactElement} A span placeholder.
 */
function Stub(): ReactElement {
  return createElement('span');
}

describe('Island CSS inlining', () => {
  it('emits a style tag above the marker once per island name', () => {
    const emitted = new Set<'mobile-navigation'>();
    const value: IslandCssContextValue = {
      cssByName: { 'mobile-navigation': '._count{font-weight:700}' },
      emitted,
    };

    const html = renderToString(
      createElement(
        IslandCssContext.Provider,
        { value },
        createElement(
          Fragment,
          null,
          createElement(Island, {
            name: 'mobile-navigation',
            component: Stub,
            props: {},
          }),
          createElement(Island, {
            name: 'mobile-navigation',
            component: Stub,
            props: {},
          }),
        ),
      ),
    );

    expect(html.match(/data-css-island="mobile-navigation"/g)).toHaveLength(1);
    expect(html.match(/data-island="mobile-navigation"/g)).toHaveLength(2);
    expect(html).toContain('._count{font-weight:700}');
    expect(html.indexOf('data-css-island')).toBeLessThan(
      html.indexOf('data-island'),
    );
  });
});
