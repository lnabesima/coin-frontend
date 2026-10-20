import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../../api/auth.ts';
import { apiClient, setTokenProvider, setUnauthorizedHandler } from '../../api/client.ts';
import { AUTH_STORAGE_KEY, AuthProvider, useAuth } from '../AuthContext.tsx';

vi.mock('../../api/auth.ts', () => ({
  probeApiKey: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}

describe('AuthContext and AuthProvider', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    setTokenProvider(undefined);
    setUnauthorizedHandler(undefined);
    vi.restoreAllMocks();
    queryClient = new QueryClient();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('useAuth outside provider', () => {
    it('throws descriptive error when useAuth is called without AuthProvider', () => {
      // Suppress console.error in React for expected boundary error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useAuth())).toThrow(
        'useAuth must be used within an AuthProvider',
      );
      consoleSpy.mockRestore();
    });
  });

  describe('hydration', () => {
    it('synchronously hydrates active apiKey from localStorage when present', () => {
      localStorage.setItem(AUTH_STORAGE_KEY, 'stored-api-key');

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.apiKey).toBe('stored-api-key');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('initializes as unauthenticated when localStorage is empty', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.apiKey).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('normalizes whitespace-only string in localStorage to null on hydration', () => {
      localStorage.setItem(AUTH_STORAGE_KEY, '   ');

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.apiKey).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('login flow', () => {
    it('throws RangeError if candidate key is empty or whitespace without probing', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(queryClient),
      });

      await expect(result.current.login('')).rejects.toThrow(RangeError);
      await expect(result.current.login('   ')).rejects.toThrow(RangeError);
      expect(authApi.probeApiKey).not.toHaveBeenCalled();
    });

    it('sets isLoading to true while probe is pending and resets to false on settle', async () => {
      let resolveProbe!: (value: boolean) => void;
      const pendingProbe = new Promise<boolean>((resolve) => {
        resolveProbe = resolve;
      });
      vi.mocked(authApi.probeApiKey).mockReturnValue(pendingProbe);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isLoading).toBe(false);

      let loginPromise: Promise<void>;
      act(() => {
        loginPromise = result.current.login('test-key');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveProbe(true);
        await loginPromise;
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.apiKey).toBe('test-key');
    });

    it('ignores duplicate concurrent login attempts when already loading', async () => {
      let resolveProbe!: (value: boolean) => void;
      const pendingProbe = new Promise<boolean>((resolve) => {
        resolveProbe = resolve;
      });
      vi.mocked(authApi.probeApiKey).mockReturnValue(pendingProbe);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(queryClient),
      });

      let firstLogin!: Promise<void>;
      act(() => {
        firstLogin = result.current.login('key-1');
      });

      // Second login invocation while first is in-flight
      act(() => {
        void result.current.login('key-2');
      });

      // Only the first probe should have been dispatched
      expect(authApi.probeApiKey).toHaveBeenCalledTimes(1);
      expect(authApi.probeApiKey).toHaveBeenCalledWith('key-1');

      await act(async () => {
        resolveProbe(true);
        await firstLogin;
      });

      expect(result.current.apiKey).toBe('key-1');
    });

    it('probes backend, saves key to storage, and updates state on successful probe', async () => {
      vi.mocked(authApi.probeApiKey).mockResolvedValue(true);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.login('  my-valid-api-key  ');
      });

      expect(authApi.probeApiKey).toHaveBeenCalledWith('my-valid-api-key');
      expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBe('my-valid-api-key');
      expect(result.current.apiKey).toBe('my-valid-api-key');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('propagates error, leaves storage untouched, and resets isLoading on failed probe', async () => {
      const probeError = new Error('401 Unauthorized');
      vi.mocked(authApi.probeApiKey).mockRejectedValue(probeError);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await expect(result.current.login('invalid-key')).rejects.toThrow('401 Unauthorized');
      });

      expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
      expect(result.current.apiKey).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('logout flow', () => {
    it('cancels in-flight queries, clears localStorage, resets state, and flushes queryClient cache', async () => {
      localStorage.setItem(AUTH_STORAGE_KEY, 'active-session-key');
      const clearSpy = vi.spyOn(queryClient, 'clear');
      const cancelSpy = vi.spyOn(queryClient, 'cancelQueries');

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
      expect(result.current.apiKey).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(cancelSpy).toHaveBeenCalledTimes(1);
      expect(clearSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('cross-tab synchronization', () => {
    it('logs out and flushes query cache when another tab removes the storage key', () => {
      localStorage.setItem(AUTH_STORAGE_KEY, 'active-key');
      const clearSpy = vi.spyOn(queryClient, 'clear');
      const cancelSpy = vi.spyOn(queryClient, 'cancelQueries');

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: AUTH_STORAGE_KEY,
            newValue: null,
            oldValue: 'active-key',
          }),
        );
      });

      expect(result.current.apiKey).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(cancelSpy).toHaveBeenCalledTimes(1);
      expect(clearSpy).toHaveBeenCalledTimes(1);
    });

    it('logs out and flushes query cache when another tab calls localStorage.clear() (key is null)', () => {
      localStorage.setItem(AUTH_STORAGE_KEY, 'active-key');
      const clearSpy = vi.spyOn(queryClient, 'clear');
      const cancelSpy = vi.spyOn(queryClient, 'cancelQueries');

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: null,
            storageArea: localStorage,
          }),
        );
      });

      expect(result.current.apiKey).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(cancelSpy).toHaveBeenCalledTimes(1);
      expect(clearSpy).toHaveBeenCalledTimes(1);
    });

    it('updates state when another tab sets a new key', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: AUTH_STORAGE_KEY,
            newValue: 'remote-tab-key',
            oldValue: null,
          }),
        );
      });

      expect(result.current.apiKey).toBe('remote-tab-key');
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('HTTP client integration', () => {
    it('triggers logout and clears state when an API request receives HTTP 401', async () => {
      localStorage.setItem(AUTH_STORAGE_KEY, 'active-session-key');
      const clearSpy = vi.spyOn(queryClient, 'clear');

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isAuthenticated).toBe(true);

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ title: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      await act(async () => {
        try {
          await apiClient.get('api/v1/protected-endpoint');
        } catch {
          // Expected 401 ApiError
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.apiKey).toBeNull();
      expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
      expect(clearSpy).toHaveBeenCalled();
    });

    it('dynamically updates outgoing apiClient requests across login and logout transitions', async () => {
      vi.mocked(authApi.probeApiKey).mockResolvedValue(true);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(queryClient),
      });

      // 1. Initial state: unauthenticated
      const fetchMock = vi.fn().mockImplementation(
        async () =>
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
      );
      vi.stubGlobal('fetch', fetchMock);

      await apiClient.get('api/v1/ping');
      let sentRequest = fetchMock.mock.calls[0][0] as Request;
      expect(sentRequest.headers.has('X-Api-Key')).toBe(false);

      // 2. Perform in-session login
      await act(async () => {
        await result.current.login('session-token-123');
      });

      fetchMock.mockClear();
      await apiClient.get('api/v1/data');
      sentRequest = fetchMock.mock.calls[0][0] as Request;
      expect(sentRequest.headers.get('X-Api-Key')).toBe('session-token-123');

      // 3. Perform in-session logout
      act(() => {
        result.current.logout();
      });

      fetchMock.mockClear();
      await apiClient.get('api/v1/ping-again');
      sentRequest = fetchMock.mock.calls[0][0] as Request;
      expect(sentRequest.headers.has('X-Api-Key')).toBe(false);
    });

    it('unmount cleanup deregisters tokenProvider and unauthorizedHandler from apiClient', async () => {
      localStorage.setItem(AUTH_STORAGE_KEY, 'temp-key');

      const hook = renderHook(() => useAuth(), {
        wrapper: createWrapper(queryClient),
      });

      // Unmount AuthProvider
      hook.unmount();

      const fetchMock = vi.fn().mockImplementation(
        async () =>
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
      );
      vi.stubGlobal('fetch', fetchMock);

      // Outgoing request after unmount should NOT inject X-Api-Key because provider cleaned up
      await apiClient.get('api/v1/after-unmount');
      const sentRequest = fetchMock.mock.calls[0][0] as Request;
      expect(sentRequest.headers.has('X-Api-Key')).toBe(false);
    });
  });
});
