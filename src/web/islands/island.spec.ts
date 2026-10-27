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
    const emitted = new Set<'counter'>();
    const value: IslandCssContextValue = {
      cssByName: { counter: '._count{font-weight:700}' },
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
            name: 'counter',
            component: Stub,
            props: {},
          }),
          createElement(Island, {
            name: 'counter',
            component: Stub,
            props: {},
          }),
        ),
      ),
    );

    expect(html.match(/data-css-island="counter"/g)).toHaveLength(1);
    expect(html.match(/data-island="counter"/g)).toHaveLength(2);
    expect(html).toContain('._count{font-weight:700}');
    expect(html.indexOf('data-css-island')).toBeLessThan(
      html.indexOf('data-island'),
    );
  });
});
