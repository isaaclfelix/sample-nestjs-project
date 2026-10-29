import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { CSRF_META_NAME } from '../../api/auth/session.constants.js';
import LoginForm from './login-form.js';

const { assignMock } = vi.hoisted(() => ({ assignMock: vi.fn() }));

vi.mock('../api-fetch/assign-location.js', () => ({
  assignLocation: assignMock,
}));

describe('LoginForm', () => {
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

  it('shows field validation when submitted empty', async () => {
    const user = userEvent.setup();
    render(createElement(LoginForm));

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByLabelText('Email or username')).toHaveClass(
      'is-invalid',
    );
    expect(screen.getByLabelText('Password')).toHaveClass('is-invalid');
    expect(
      screen.getAllByText(/too small|expected string/i).length,
    ).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows Invalid credentials for 401', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'nope' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    render(createElement(LoginForm));

    await user.type(
      screen.getByLabelText('Email or username'),
      'ada@example.com',
    );
    await user.type(screen.getByLabelText('Password'), 'correct-horse-battery');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid credentials.',
    );
  });

  it('shows CSRF expiry message for 403', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(new Response(null, { status: 403 }));
    render(createElement(LoginForm));

    await user.type(
      screen.getByLabelText('Email or username'),
      'ada@example.com',
    );
    await user.type(screen.getByLabelText('Password'), 'correct-horse-battery');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Security token expired',
    );
  });

  it('shows rate-limit message for 429', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(new Response(null, { status: 429 }));
    render(createElement(LoginForm));

    await user.type(
      screen.getByLabelText('Email or username'),
      'ada@example.com',
    );
    await user.type(screen.getByLabelText('Password'), 'correct-horse-battery');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many login attempts',
    );
  });

  it('disables submit while pending then redirects home on success', async () => {
    const user = userEvent.setup();
    let resolveFetch!: (value: Response) => void;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    render(createElement(LoginForm));

    await user.type(
      screen.getByLabelText('Email or username'),
      'ada@example.com',
    );
    await user.type(screen.getByLabelText('Password'), 'correct-horse-battery');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Logging in…' }),
      ).toBeDisabled();
    });

    resolveFetch(
      new Response(JSON.stringify({ id: '1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith('/');
    });
  });
});
