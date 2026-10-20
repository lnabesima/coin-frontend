import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { probeApiKey } from '../api/auth.ts';
import { setTokenProvider, setUnauthorizedHandler } from '../api/client.ts';
import { getStorageItem, removeStorageItem, setStorageItem } from '../utils/storage.ts';

export const AUTH_STORAGE_KEY = 'coin_api_key';

export interface AuthContextValue {
  readonly apiKey: string | null;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  login: (candidateKey: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();

  const [apiKey, setApiKey] = useState<string | null>(
    () => getStorageItem(AUTH_STORAGE_KEY)?.trim() || null,
  );

  const [isLoading, setIsLoading] = useState(false);

  const apiKeyRef = useRef(apiKey);
  apiKeyRef.current = apiKey;

  // Synchronize HTTP client token provider synchronously on layout to avoid mount races with children
  useLayoutEffect(() => {
    setTokenProvider(() => apiKeyRef.current);
    return () => {
      setTokenProvider(undefined);
    };
  }, []);

  const logout = useCallback(() => {
    removeStorageItem(AUTH_STORAGE_KEY);
    void queryClient.cancelQueries();
    queryClient.clear();
    setApiKey(null);
  }, [queryClient]);

  // Register global 401 callback to trigger logout on session expiration
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => {
      setUnauthorizedHandler(undefined);
    };
  }, [logout]);

  // Synchronize auth state across browser tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === AUTH_STORAGE_KEY ||
        (event.key === null && event.storageArea === localStorage)
      ) {
        const newKey = event.newValue?.trim() || null;
        setApiKey(newKey);
        if (!newKey) {
          void queryClient.cancelQueries();
          queryClient.clear();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [queryClient]);

  const login = useCallback(
    async (candidateKey: string): Promise<void> => {
      if (isLoading) {
        return;
      }

      const trimmed = candidateKey.trim();
      if (trimmed.length === 0) {
        throw new RangeError('Candidate API key cannot be empty');
      }

      setIsLoading(true);
      try {
        await probeApiKey(trimmed);
        setStorageItem(AUTH_STORAGE_KEY, trimmed);
        setApiKey(trimmed);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      apiKey,
      isAuthenticated: apiKey !== null && apiKey.trim().length > 0,
      isLoading,
      login,
      logout,
    }),
    [apiKey, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
