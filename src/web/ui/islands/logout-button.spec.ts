import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { CSRF_META_NAME } from '../../../api/auth/session.constants';
import LogoutButton from './logout-button';

const { assignMock } = vi.hoisted(() => ({ assignMock: vi.fn() }));

vi.mock('../api-fetch/assign-location', () => ({
  assignLocation: assignMock,
}));

describe('LogoutButton', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.head.innerHTML = `<meta name="${CSRF_META_NAME}" content="csrf-test" />`;
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    assignMock.mockReset();
  });

  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('shows pending label then redirects to login on success', async () => {
    const user = userEvent.setup();
    let resolveFetch!: (value: Response) => void;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    render(createElement(LogoutButton));

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Logging out…' }),
      ).toBeDisabled();
    });

    resolveFetch(new Response(null, { status: 204 }));

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith('/login');
    });
  });

  it('still redirects to login when logout returns 401', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));
    render(createElement(LogoutButton));

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith('/login');
    });
  });
});
