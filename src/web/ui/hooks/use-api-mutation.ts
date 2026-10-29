import { useCallback, useState } from 'react';
import { apiRequestDefaults } from '../api-fetch/api-request-defaults';
import { getCsrfTokenHeader } from '../api-fetch/csrf';

/** Successful mutating API response. */
export type ApiMutationSuccess<TData> = {
  ok: true;
  status: number;
  data: TData;
};

/** Failed mutating API response (non-2xx). */
export type ApiMutationFailure = {
  ok: false;
  status: number;
  data: unknown;
};

/** Discriminated result from {@link useApiMutation}'s `mutate`. */
export type ApiMutationResult<TData> =
  ApiMutationSuccess<TData> | ApiMutationFailure;

type HttpMutationMethod = 'POST' | 'PATCH' | 'DELETE' | 'PUT';

/**
 * Runs same-origin mutating `fetch` calls with CSRF and shared defaults.
 *
 * Prefer `formState.isSubmitting` from react-hook-form to disable submit
 * controls when the island already uses RHF. Use `isPending` from this hook
 * for non-form islands (for example logout).
 *
 * @template TBody - JSON body type passed to `mutate` (omit for empty body).
 * @template TData - Parsed JSON success body type (unused for 204).
 * @param {string} path - Absolute API path (for example `/api/auth/login`).
 * @param {HttpMutationMethod} [method='POST'] - HTTP method for the mutation.
 * @returns {{ mutate: (body?: TBody) => Promise<ApiMutationResult<TData>>; isPending: boolean }}
 *   `mutate` helper and pending flag for non-RHF UI.
 */
export function useApiMutation<TBody = void, TData = unknown>(
  path: string,
  method: HttpMutationMethod = 'POST',
): {
  mutate: (body?: TBody) => Promise<ApiMutationResult<TData>>;
  isPending: boolean;
} {
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async (body?: TBody): Promise<ApiMutationResult<TData>> => {
      setIsPending(true);
      try {
        const response = await fetch(path, {
          ...apiRequestDefaults,
          method,
          headers: {
            ...apiRequestDefaults.headers,
            ...getCsrfTokenHeader(),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
        });

        // 204 has no body; other statuses may still return JSON error payloads.
        const data =
          response.status === 204
            ? (undefined as TData)
            : ((await response.json().catch(() => null)) as TData);

        if (!response.ok) {
          return { ok: false, status: response.status, data };
        }

        return { ok: true, status: response.status, data };
      } finally {
        setIsPending(false);
      }
    },
    [path, method],
  );

  return { mutate, isPending };
}
