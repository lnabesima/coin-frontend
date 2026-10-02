import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { probeApiKey } from '../auth.ts';
import { setTokenProvider, setUnauthorizedHandler } from '../client.ts';
import { isApiError } from '../errors.ts';

describe('Auth API Module', () => {
  beforeEach(() => {
    setTokenProvider(undefined);
    setUnauthorizedHandler(undefined);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('probeApiKey', () => {
    it('throws RangeError when candidate key is empty or whitespace', async () => {
      await expect(probeApiKey('')).rejects.toThrow(RangeError);
      await expect(probeApiKey('   ')).rejects.toThrow(RangeError);
    });

    it('trims leading and trailing whitespace from candidate key before sending in header', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      await probeApiKey('   padded-secret-key   ');

      const sentRequest = fetchMock.mock.calls[0][0] as Request;
      expect(sentRequest.headers.get('X-Api-Key')).toBe('padded-secret-key');
    });

    it('probes transactions endpoint with candidate key, overriding any active tokenProvider', async () => {
      // Simulate an existing saved key in session
      setTokenProvider(() => 'active-saved-key');

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      const isValid = await probeApiKey('candidate-secret-key');
      expect(isValid).toBe(true);

      const sentRequest = fetchMock.mock.calls[0][0] as Request;
      expect(sentRequest.url).toContain('api/v1/transactions');
      expect(sentRequest.url).toContain('limit=1');
      // Candidate key MUST override the active tokenProvider key
      expect(sentRequest.headers.get('X-Api-Key')).toBe('candidate-secret-key');
    });

    it('propagates ApiError on 401 without triggering the global unauthorizedHandler', async () => {
      const onUnauthorized = vi.fn();
      setUnauthorizedHandler(onUnauthorized);

      const problem = {
        status: 401,
        title: 'Unauthorized',
        detail: 'Invalid API key provided',
      };

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(problem), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      try {
        await probeApiKey('wrong-key');
        expect.unreachable('Should have rejected with ApiError');
      } catch (err: unknown) {
        expect(isApiError(err)).toBe(true);
        if (isApiError(err)) {
          expect(err.status).toBe(401);
          expect(err.title).toBe('Unauthorized');
          expect(err.detail).toBe('Invalid API key provided');
        }
      }

      // CRITICAL: Probing an invalid candidate key MUST NOT trigger global session logout
      expect(onUnauthorized).not.toHaveBeenCalled();
    });
  });
});
