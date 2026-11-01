import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { HomePage } from './home-page';

describe('HomePage', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the SSR timestamp and layout chrome', () => {
    render(
      createElement(HomePage, {
        renderedAt: '2026-10-22T12:00:00.000Z',
        isAuthenticated: false,
      }),
    );

    expect(
      screen.getByText('Rendered on the server at 2026-10-22T12:00:00.000Z.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
