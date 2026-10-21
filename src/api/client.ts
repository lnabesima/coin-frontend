import ky, { isHTTPError, type Options } from 'ky';
import { createApiError, type ProblemDetails } from './errors.ts';

export type TokenProvider = () => string | null;
export type UnauthorizedHandler = () => void;

let tokenProvider: TokenProvider | undefined;
let unauthorizedHandler: UnauthorizedHandler | undefined;

/**
 * Registers a token provider callback that supplies the current API key.
 * Keeps the HTTP transport layer decoupled from React context and localStorage.
 */
export function setTokenProvider(provider?: TokenProvider): void {
  tokenProvider = provider;
}

/**
 * Registers a callback invoked whenever an HTTP 401 Unauthorized response is received.
 */
export function setUnauthorizedHandler(handler?: UnauthorizedHandler): void {
  unauthorizedHandler = handler;
}

const prefix = import.meta.env.VITE_API_BASE_URL;

function parseProblemDetails(response: Response, data: unknown): ProblemDetails {
  if (typeof data === 'object' && data !== null) {
    return { status: response.status, ...data };
  }

  return {
    status: response.status,
    title:
      typeof data === 'string' && data.trim().length > 0
        ? data
        : response.statusText || 'Request Failed',
  };
}

export const kyInstance = ky.create({
  prefix,
  timeout: 20000,
  retry: 0, // TanStack Query manages retry policies and backoffs
  hooks: {
    beforeRequest: [
      ({ request }) => {
        if (request.headers.has('X-Api-Key')) {
          return;
        }
        const token = tokenProvider?.();
        if (token && token.trim().length > 0) {
          request.headers.set('X-Api-Key', token.trim());
        }
      },
    ],
    afterResponse: [
      ({ response, options }) => {
        if (options.context.skipUnauthorizedHandler) {
          return;
        }
        if (response.status === 401 && unauthorizedHandler) {
          unauthorizedHandler();
        }
      },
    ],
    beforeError: [
      async ({ error }) => {
        if (!isHTTPError(error)) {
          return error;
        }

        throw createApiError(parseProblemDetails(error.response, error.data));
      },
    ],
  },
});

export const apiClient = {
  get: <T>(path: string, options?: Options) => kyInstance.get(path, options).json<T>(),
  post: <T>(path: string, options?: Options) => kyInstance.post(path, options).json<T>(),
  put: <T>(path: string, options?: Options) => kyInstance.put(path, options).json<T>(),
  delete: async (path: string, options?: Options): Promise<void> => {
    await kyInstance.delete(path, options);
  },
  raw: kyInstance,
};
