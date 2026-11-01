import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { CSRF_META_NAME } from '@api/auth/session.constants';
import MobileNavigation from './mobile-navigation';

describe('MobileNavigation', () => {
  beforeEach(() => {
    document.head.innerHTML = `<meta name="${CSRF_META_NAME}" content="csrf-test" />`;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
  });

  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('opens the drawer and shows guest auth links', async () => {
    const user = userEvent.setup();
    render(createElement(MobileNavigation, { isAuthenticated: false }));

    const toggle = screen.getByRole('button', { expanded: false });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    await waitFor(() => {
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
  });

  it('shows Logout when authenticated after opening the drawer', async () => {
    const user = userEvent.setup();
    render(createElement(MobileNavigation, { isAuthenticated: true }));

    await user.click(screen.getByRole('button', { expanded: false }));

    expect(
      await screen.findByRole('button', { name: 'Logout' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Login' }),
    ).not.toBeInTheDocument();
  });

  it('starts the close animation when the open toggle is clicked again', async () => {
    const user = userEvent.setup();
    render(createElement(MobileNavigation, { isAuthenticated: false }));

    const toggle = screen.getByRole('button', { expanded: false });
    await user.click(toggle);
    await waitFor(() => {
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });

    await user.click(toggle);
    await waitFor(() => {
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('clears the closing class when the drawer exit animation ends', async () => {
    const user = userEvent.setup();
    const { container } = render(
      createElement(MobileNavigation, { isAuthenticated: false }),
    );

    const toggle = screen.getByRole('button', { expanded: false });
    await user.click(toggle);
    await waitFor(() => {
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });
    await user.click(toggle);
    await waitFor(() => {
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    // Fragment children: toggle button, backdrop, drawer (backdrop listens too).
    const backdrop = container.children[1];
    expect(backdrop).toBeInstanceOf(HTMLElement);

    // Bubbled child animationend must not clear closing (target !== currentTarget).
    const child = document.createElement('span');
    backdrop.appendChild(child);
    await act(async () => {
      child.dispatchEvent(new Event('animationend', { bubbles: true }));
    });

    // Own animationend finishes the close cycle.
    await act(async () => {
      backdrop.dispatchEvent(new Event('animationend', { bubbles: true }));
    });
  });
});
