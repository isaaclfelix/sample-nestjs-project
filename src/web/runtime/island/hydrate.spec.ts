// @vitest-environment happy-dom
import { act, createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateIslands } from './hydrate.js';
import { Island } from './island.js';
import MobileNavigation from '../../islands/mobile-navigation.js';

describe('hydrate islands', () => {
  it('opens the mobile navigation drawer when the toggle is clicked', async () => {
    document.body.innerHTML = renderToString(
      createElement(Island, {
        name: 'mobile-navigation',
        component: MobileNavigation,
        props: {},
      }),
    );

    await hydrateIslands(document);

    const button = document.querySelector('button');
    expect(button?.getAttribute('aria-expanded')).toBe('false');

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(button?.getAttribute('aria-expanded')).toBe('true');
  });

  it('throws when a marker names an unknown island', async () => {
    document.body.innerHTML =
      '<div data-island="chart" data-props="%7B%7D"></div>';

    await expect(hydrateIslands(document)).rejects.toThrow(
      'Unknown island: chart',
    );
  });
});
