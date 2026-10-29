import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { CSRF_META_NAME } from '../../../api/auth/session.constants.js';
import RegisterForm from './register-form.js';

const { assignMock } = vi.hoisted(() => ({ assignMock: vi.fn() }));

vi.mock('../api-fetch/assign-location.js', () => ({
  assignLocation: assignMock,
}));

/**
 * Fills the register form with valid field values.
 *
 * @param {ReturnType<typeof userEvent.setup>} user - Testing Library user.
 * @returns {Promise<void>}
 */
async function fillValidRegisterForm(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  await user.type(screen.getByLabelText('Username'), 'ada');
  await user.type(screen.getByLabelText('Display name'), 'Ada');
  await user.type(screen.getByLabelText('Password'), 'correct-horse-battery');
}

describe('RegisterForm', () => {
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
    render(createElement(RegisterForm));

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByLabelText('Email')).toHaveClass('is-invalid');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows conflict message for 409', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Email already registered' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    render(createElement(RegisterForm));

    await fillValidRegisterForm(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email already registered',
    );
  });

  it('shows CSRF expiry message for 403', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(new Response(null, { status: 403 }));
    render(createElement(RegisterForm));

    await fillValidRegisterForm(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Security token expired',
    );
  });

  it('shows rate-limit message for 429', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(new Response(null, { status: 429 }));
    render(createElement(RegisterForm));

    await fillValidRegisterForm(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many registration attempts',
    );
  });

  it('disables submit while pending then redirects to login on success', async () => {
    const user = userEvent.setup();
    let resolveFetch!: (value: Response) => void;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    render(createElement(RegisterForm));

    await fillValidRegisterForm(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Creating account…' }),
      ).toBeDisabled();
    });

    resolveFetch(
      new Response(JSON.stringify({ id: '1' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith('/login');
    });
  });
});
