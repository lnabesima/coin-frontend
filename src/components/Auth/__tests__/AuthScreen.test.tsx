import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiError } from '../../../api/errors.ts';
import { AUTH_STORAGE_KEY, AuthProvider } from '../../../context/AuthContext.tsx';
import { AuthScreen } from '../AuthScreen.tsx';

const mockProbeApiKey = vi.fn();

vi.mock('../../../api/auth.ts', () => ({
  probeApiKey: (key: string) => mockProbeApiKey(key),
}));

function renderAuthScreen() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthScreen />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('AuthScreen Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the branding header, api key input, and submit button', () => {
    renderAuthScreen();

    expect(screen.getByRole('heading', { name: /^coin$/i })).toBeInTheDocument();
    expect(screen.getByText(/personal finance tracker/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/chave de acesso/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('toggles input visibility when clicking show/hide toggle', async () => {
    const user = userEvent.setup();
    renderAuthScreen();

    const input = screen.getByLabelText(/chave de acesso/i);
    expect(input).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button', { name: /mostrar chave/i });
    await user.click(toggleButton);

    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /ocultar chave/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /ocultar chave/i }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('displays client validation error when submitting empty or whitespace input', async () => {
    const user = userEvent.setup();
    renderAuthScreen();

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    await user.click(submitButton);

    expect(screen.getByRole('alert')).toHaveTextContent(/por favor, informe a chave de acesso/i);
    expect(mockProbeApiKey).not.toHaveBeenCalled();

    const input = screen.getByLabelText(/chave de acesso/i);
    await user.type(input, '   ');
    await user.click(submitButton);

    expect(screen.getByRole('alert')).toHaveTextContent(/por favor, informe a chave de acesso/i);
    expect(mockProbeApiKey).not.toHaveBeenCalled();
  });

  it('clears inline validation error when typing after a failed attempt', async () => {
    const user = userEvent.setup();
    renderAuthScreen();

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    await user.click(submitButton);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    const input = screen.getByLabelText(/chave de acesso/i);
    await user.type(input, 'a');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('links input to error alert via aria-describedby when validation fails', async () => {
    const user = userEvent.setup();
    renderAuthScreen();

    const input = screen.getByLabelText(/chave de acesso/i);
    expect(input).not.toHaveAttribute('aria-describedby');

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    await user.click(submitButton);

    expect(input).toHaveAttribute('aria-describedby', 'auth-error');
    expect(screen.getByRole('alert')).toHaveAttribute('id', 'auth-error');

    await user.type(input, 'a');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('calls probeApiKey with trimmed key and stores it when valid input is submitted via click', async () => {
    const user = userEvent.setup();
    mockProbeApiKey.mockResolvedValueOnce(true);
    renderAuthScreen();

    const input = screen.getByLabelText(/chave de acesso/i);
    await user.type(input, '  secret_api_key_123  ');

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockProbeApiKey).toHaveBeenCalledTimes(1);
      expect(mockProbeApiKey).toHaveBeenCalledWith('secret_api_key_123');
      expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBe('secret_api_key_123');
    });
  });

  it('submits form and calls probeApiKey when pressing Enter key inside input', async () => {
    const user = userEvent.setup();
    mockProbeApiKey.mockResolvedValueOnce(true);
    renderAuthScreen();

    const input = screen.getByLabelText(/chave de acesso/i);
    await user.type(input, 'key_via_enter{enter}');

    await waitFor(() => {
      expect(mockProbeApiKey).toHaveBeenCalledTimes(1);
      expect(mockProbeApiKey).toHaveBeenCalledWith('key_via_enter');
    });
  });

  it('disables input and submit button and displays loading status while in-flight probe is executing', async () => {
    const user = userEvent.setup();
    let resolveProbe!: (value: boolean) => void;
    const pendingProbe = new Promise<boolean>((resolve) => {
      resolveProbe = resolve;
    });
    mockProbeApiKey.mockReturnValueOnce(pendingProbe);

    renderAuthScreen();

    const input = screen.getByLabelText(/chave de acesso/i);
    await user.type(input, 'in_flight_key');

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    await user.click(submitButton);

    // While probe is in-flight, real AuthProvider sets isLoading=true
    expect(screen.getByRole('button', { name: /conectando/i })).toBeDisabled();
    expect(input).toBeDisabled();
    expect(screen.getByText(/conectando à nuvem/i)).toBeInTheDocument();

    // Resolve the probe to finish cleanly
    resolveProbe(true);

    await waitFor(() => {
      expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBe('in_flight_key');
    });
  });

  it('surfaces 401 unauthorized message when probeApiKey rejects with 401 ApiError', async () => {
    const user = userEvent.setup();
    const error401 = createApiError({
      status: 401,
      title: 'Unauthorized',
      detail: 'Invalid API Key',
    });
    mockProbeApiKey.mockRejectedValueOnce(error401);

    renderAuthScreen();

    const input = screen.getByLabelText(/chave de acesso/i);
    await user.type(input, 'wrong_key');

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/chave de acesso inválida ou expirada/i);
    });

    expect(input).toBeEnabled();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeEnabled();
  });

  it('surfaces generic connection error instead of credential error on 504 Gateway Timeout', async () => {
    const user = userEvent.setup();
    const error504 = createApiError({
      status: 504,
      title: 'Gateway Timeout',
      detail: 'Upstream container took too long to spin up.',
    });
    mockProbeApiKey.mockRejectedValueOnce(error504);

    renderAuthScreen();

    const input = screen.getByLabelText(/chave de acesso/i);
    await user.type(input, 'candidate_key{enter}');

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/não foi possível conectar ao servidor/i);
      expect(alert).not.toHaveTextContent(/chave de acesso inválida/i);
    });

    expect(input).toBeEnabled();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeEnabled();
  });

  it('surfaces generic error message when probeApiKey rejects with a network error', async () => {
    const user = userEvent.setup();
    mockProbeApiKey.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    renderAuthScreen();

    const input = screen.getByLabelText(/chave de acesso/i);
    await user.type(input, 'valid_format_key');

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível conectar ao servidor/i);
    });

    expect(input).toBeEnabled();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeEnabled();
  });
});
