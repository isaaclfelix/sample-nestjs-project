import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, useState, type ReactElement } from 'react';
import { CSRF_META_NAME } from '../../../api/auth/session.constants.js';
import { useApiMutation, type ApiMutationResult } from './use-api-mutation.js';

/**
 * Test harness that exposes mutate via a button click.
 *
 * @param {{ path: string; body?: unknown; onResult: (result: ApiMutationResult<unknown>) => void }} props -
 *   Mutation path, optional body, and result callback.
 * @returns {ReactElement} Button that triggers the mutation.
 */
function MutateButton(props: {
  path: string;
  body?: unknown;
  onResult: (result: ApiMutationResult<unknown>) => void;
}): ReactElement {
  const { mutate, isPending } = useApiMutation<unknown>(props.path);
  const [error, setError] = useState<string | null>(null);

  return createElement(
    'button',
    {
      type: 'button',
      disabled: isPending,
      onClick: () => {
        void mutate(props.body)
          .then(props.onResult)
          .catch((caught: unknown) => {
            setError(caught instanceof Error ? caught.message : 'failed');
          });
      },
    },
    error ?? 'go',
  );
}

describe('useApiMutation', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.head.innerHTML = `<meta name="${CSRF_META_NAME}" content="csrf-test" />`;
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  /**
   * Renders the harness and clicks the mutate button.
   *
   * @param {{ path: string; body?: unknown }} options - Path and optional body.
   * @returns {Promise<ApiMutationResult<unknown>>} Mutation result.
   */
  async function runMutation(options: {
    path: string;
    body?: unknown;
  }): Promise<ApiMutationResult<unknown>> {
    let result: ApiMutationResult<unknown> | undefined;
    const user = userEvent.setup();

    render(
      createElement(MutateButton, {
        path: options.path,
        body: options.body,
        onResult: (value: ApiMutationResult<unknown>) => {
          result = value;
        },
      }),
    );

    await user.click(screen.getByRole('button', { name: 'go' }));

    expect(result).toBeDefined();
    return result as ApiMutationResult<unknown>;
  }

  it('POSTs JSON with credentials and CSRF header', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: '1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await runMutation({
      path: '/api/auth/login',
      body: { identifier: 'ada', password: 'correct-horse' },
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      credentials: 'same-origin',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': 'csrf-test',
      },
      body: JSON.stringify({
        identifier: 'ada',
        password: 'correct-horse',
      }),
    });
    expect(result).toEqual({
      ok: true,
      status: 200,
      data: { id: '1' },
    });
  });

  it('returns ok false with status on error responses', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await runMutation({
      path: '/api/auth/login',
      body: { identifier: 'x', password: 'wrong-password' },
    });

    expect(result).toEqual({
      ok: false,
      status: 401,
      data: { message: 'Invalid credentials' },
    });
  });

  it('treats 204 as success with undefined data', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const result = await runMutation({ path: '/api/auth/logout' });

    expect(result).toEqual({ ok: true, status: 204, data: undefined });
  });

  it('uses null data when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response('not-json', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      }),
    );

    const result = await runMutation({ path: '/api/auth/login', body: {} });

    expect(result).toEqual({ ok: false, status: 500, data: null });
  });
});
