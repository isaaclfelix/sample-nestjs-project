// @vitest-environment happy-dom
import { act, createElement, useState, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CSRF_META_NAME } from '../../api/auth/session.constants.js';
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
  let container: HTMLDivElement;
  let root: Root;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.head.innerHTML = `<meta name="${CSRF_META_NAME}" content="csrf-test" />`;
    container = document.createElement('div');
    document.body.appendChild(container);
    // React 19 act() needs this flag under happy-dom.
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    root = createRoot(container);
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    document.head.innerHTML = '';
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

    await act(async () => {
      root.render(
        createElement(MutateButton, {
          path: options.path,
          body: options.body,
          onResult: (value) => {
            result = value;
          },
        }),
      );
    });

    const button = container.querySelector('button');
    expect(button).not.toBeNull();

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

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
});
