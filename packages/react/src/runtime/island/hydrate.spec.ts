import { act, createElement, useState, type ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import userEvent from '@testing-library/user-event';
import { registerIslands } from '@archipielago/core/islands';
import { hydrateIslands } from './hydrate';
import { Island } from './island';
import {
  resetIslandLoadersCache,
  resetIslandModules,
  setIslandModules,
} from './registry';

/**
 * In-package toggle stub so hydrate tests do not import Nest product islands.
 *
 * @returns {ReactElement} Button whose aria-expanded flips on click.
 */
function ToggleStub(): ReactElement {
  const [open, setOpen] = useState(false);
  return createElement(
    'button',
    {
      type: 'button',
      'aria-expanded': open ? 'true' : 'false',
      onClick: () => {
        setOpen(true);
      },
    },
    'Toggle',
  );
}

describe('hydrate islands', () => {
  beforeEach(() => {
    // Register a fixture island; do not depend on the Nest example manifest.
    registerIslands({ 'toggle-stub': { hasCssModule: false } });
    setIslandModules({
      '../../islands/toggle-stub/toggle-stub.tsx': async () => ({
        default: ToggleStub,
      }),
    });
    resetIslandLoadersCache();
  });

  afterEach(() => {
    registerIslands(undefined);
    resetIslandModules();
    document.body.innerHTML = '';
  });

  it('opens the stub drawer when the toggle is clicked', async () => {
    document.body.innerHTML = renderToString(
      createElement(Island, {
        name: 'toggle-stub',
        component: ToggleStub,
        props: {},
      }),
    );

    await hydrateIslands(document);

    const button = document.querySelector('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await act(async () => {
      await userEvent.click(button!);
    });

    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('throws when a marker names an unknown island', async () => {
    document.body.innerHTML =
      '<div data-island="chart" data-props="%7B%7D"></div>';

    await expect(hydrateIslands(document)).rejects.toThrow(
      'Unknown island: chart',
    );
  });
});
