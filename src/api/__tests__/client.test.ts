import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, setTokenProvider, setUnauthorizedHandler } from '../client.ts';
import { isApiError } from '../errors.ts';

describe('API Client Module', () => {
  beforeEach(() => {
    setTokenProvider(undefined);
    setUnauthorizedHandler(undefined);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('path handling', () => {
    it('normalizes paths with leading slashes without double slashes in URL', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      await apiClient.get<{ ok: boolean }>('/api/v1/test');

      const sentRequest = fetchMock.mock.calls[0][0] as Request;
      expect(sentRequest.url).toBe('https://localhost:7000/api/v1/test');
    });
  });

  describe('token injection via beforeRequest hook', () => {
    it('injects X-Api-Key when token provider returns a key', async () => {
      setTokenProvider(() => 'my-secret-key');

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      const result = await apiClient.get<{ ok: boolean }>('api/v1/test');
      expect(result).toEqual({ ok: true });

      const sentRequest = fetchMock.mock.calls[0][0] as Request;
      expect(sentRequest.headers.get('X-Api-Key')).toBe('my-secret-key');
    });

    it('omits X-Api-Key when token provider returns null', async () => {
      setTokenProvider(() => null);

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      await apiClient.get('api/v1/test');

      const sentRequest = fetchMock.mock.calls[0][0] as Request;
      expect(sentRequest.headers.has('X-Api-Key')).toBe(false);
    });

    it('omits X-Api-Key when token provider returns whitespace-only string', async () => {
      setTokenProvider(() => '   ');

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      await apiClient.get('api/v1/test');

      const sentRequest = fetchMock.mock.calls[0][0] as Request;
      expect(sentRequest.headers.has('X-Api-Key')).toBe(false);
    });

    it('preserves caller-specified X-Api-Key over token provider', async () => {
      setTokenProvider(() => 'provider-token');

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      await apiClient.get('api/v1/test', {
        headers: { 'X-Api-Key': 'override-token' },
      });

      const sentRequest = fetchMock.mock.calls[0][0] as Request;
      expect(sentRequest.headers.get('X-Api-Key')).toBe('override-token');
    });
  });

  describe('unauthorized handler via afterResponse hook', () => {
    it('calls unauthorizedHandler when HTTP 401 is received', async () => {
      const onUnauthorized = vi.fn();
      setUnauthorizedHandler(onUnauthorized);

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ title: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      await expect(apiClient.get('api/v1/protected')).rejects.toThrow();
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it('does not call unauthorizedHandler on non-401 error status codes', async () => {
      const onUnauthorized = vi.fn();
      setUnauthorizedHandler(onUnauthorized);

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: 500, title: 'Server Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      await expect(apiClient.get('api/v1/failing')).rejects.toThrow();
      expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it('skips unauthorizedHandler when context.skipUnauthorizedHandler is true', async () => {
      const onUnauthorized = vi.fn();
      setUnauthorizedHandler(onUnauthorized);

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ title: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      await expect(
        apiClient.get('api/v1/probe', {
          context: { skipUnauthorizedHandler: true },
        }),
      ).rejects.toThrow();

      expect(onUnauthorized).not.toHaveBeenCalled();
    });
  });

  describe('error transformation via beforeError hook', () => {
    it('transforms RFC 7807 ProblemDetails JSON into ApiError', async () => {
      const problem = {
        status: 400,
        title: 'Bad Request',
        detail: 'Description cannot be empty',
        errors: { Description: ['Description required'] },
      };

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(problem), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      try {
        await apiClient.get('api/v1/transactions');
        expect.unreachable('Should have thrown ApiError');
      } catch (err: unknown) {
        expect(isApiError(err)).toBe(true);
        if (isApiError(err)) {
          expect(err.status).toBe(400);
          expect(err.detail).toBe('Description cannot be empty');
          expect(err.errors).toEqual({ Description: ['Description required'] });
        }
      }
    });

    it('handles non-JSON error response gracefully', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response('Internal Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      try {
        await apiClient.get('api/v1/broken');
        expect.unreachable('Should have thrown ApiError');
      } catch (err: unknown) {
        expect(isApiError(err)).toBe(true);
        if (isApiError(err)) {
          expect(err.status).toBe(500);
          expect(err.title).toBe('Internal Server Error');
        }
      }
    });

    it('falls back to default title when error body is empty and statusText is missing', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(null, {
          status: 502,
          statusText: '',
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      try {
        await apiClient.get('api/v1/empty-gateway-error');
        expect.unreachable('Should have thrown ApiError');
      } catch (err: unknown) {
        expect(isApiError(err)).toBe(true);
        if (isApiError(err)) {
          expect(err.status).toBe(502);
          expect(err.title).toBe('Request Failed');
        }
      }
    });

    it('propagates raw network failure as-is without wrapping in ApiError', async () => {
      const networkError = new TypeError('Failed to fetch');
      const fetchMock = vi.fn().mockRejectedValue(networkError);
      vi.stubGlobal('fetch', fetchMock);

      try {
        await apiClient.get('api/v1/offline');
        expect.unreachable('Should have thrown network error');
      } catch (err: unknown) {
        expect(isApiError(err)).toBe(false);
        // Ky wraps network errors in its NetworkError class, preserving the original cause
        expect(err).toBeInstanceOf(Error);
      }
    });
  });

  describe('HTTP methods', () => {
    it('executes DELETE and resolves void on 204 No Content', async () => {
      let capturedMethod: string | undefined;
      const fetchMock = vi.fn().mockImplementation(async (req: Request) => {
        capturedMethod = req.method;
        return new Response(null, {
          status: 204,
        });
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await apiClient.delete('api/v1/transactions/123');
      expect(result).toBeUndefined();
      expect(capturedMethod).toBe('DELETE');
    });
  });
});
