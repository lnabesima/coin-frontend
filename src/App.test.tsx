import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.tsx';
import { AUTH_STORAGE_KEY } from './context/AuthContext.tsx';

const mockProbeApiKey = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock('./api/auth.ts', () => ({
  probeApiKey: (key: string) => mockProbeApiKey(key),
}));

describe('App Root Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  it('renders the AuthScreen when the user is unauthenticated', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: /^coin$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/chave de acesso/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sair/i })).not.toBeInTheDocument();
  });

  it('renders the authenticated application shell when an api key is present', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, 'stored_valid_key');

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: /^coin$/i })).toBeInTheDocument();
    expect(
      screen.getByText(/ready for fast, offline-first mobile expense tracking/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/chave de acesso/i)).not.toBeInTheDocument();
  });

  it('transitions from AuthScreen to authenticated dashboard upon successful login', async () => {
    const user = userEvent.setup();
    mockProbeApiKey.mockResolvedValueOnce(true);

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );

    // Initial unauthenticated state
    const input = screen.getByLabelText(/chave de acesso/i);
    expect(input).toBeInTheDocument();

    // Type key and press Enter
    await user.type(input, 'my-prod-key-12345{enter}');

    // Expect probeApiKey called
    expect(mockProbeApiKey).toHaveBeenCalledWith('my-prod-key-12345');

    // Wait for view transition to authenticated dashboard
    await waitFor(() => {
      expect(
        screen.getByText(/ready for fast, offline-first mobile expense tracking/i),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/chave de acesso/i)).not.toBeInTheDocument();
    });

    // Check localStorage persistence
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBe('my-prod-key-12345');
  });

  it('allows logging out from the authenticated dashboard and returns to AuthScreen', async () => {
    const user = userEvent.setup();
    localStorage.setItem(AUTH_STORAGE_KEY, 'stored_valid_key');

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );

    const logoutButton = screen.getByRole('button', { name: /sair/i });
    await user.click(logoutButton);

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(screen.getByLabelText(/chave de acesso/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('triggers a success toast notification when test button is clicked in dashboard', async () => {
    const user = userEvent.setup();
    localStorage.setItem(AUTH_STORAGE_KEY, 'stored_valid_key');

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );

    const button = screen.getByRole('button', { name: /test toast notification/i });
    await user.click(button);

    expect(toast.success).toHaveBeenCalledWith('Tooling initialized successfully!');
  });
});
