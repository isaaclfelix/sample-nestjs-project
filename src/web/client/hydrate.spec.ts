// @vitest-environment happy-dom
import { act, createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateIslands } from './hydrate.js';
import Counter from '../islands/counter.js';
import { Island } from '../islands/island.js';

describe('hydrate islands', () => {
  it('updates the counter when the button is clicked', async () => {
    document.body.innerHTML = renderToString(
      createElement(Island, {
        name: 'counter',
        component: Counter,
        props: { start: 1 },
      }),
    );

    await hydrateIslands(document);

    const button = document.querySelector('button');
    expect(button?.textContent).toBe('Count: 1');

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(button?.textContent).toBe('Count: 2');
  });

  it('throws when a marker names an unknown island', async () => {
    document.body.innerHTML =
      '<div data-island="chart" data-props="%7B%7D"></div>';

    await expect(hydrateIslands(document)).rejects.toThrow(
      'Unknown island: chart',
    );
  });
});
