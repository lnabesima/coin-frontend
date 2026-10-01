import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.tsx';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe('App Smoke Test', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  it('renders the application header and title', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: /coin/i })).toBeInTheDocument();
    expect(screen.getByText(/personal finance tracker/i)).toBeInTheDocument();
  });

  it('triggers a success toast notification when test button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );

    const button = screen.getByRole('button', { name: /test toast notification/i });
    expect(button).toBeInTheDocument();

    await user.click(button);

    expect(toast.success).toHaveBeenCalledWith('Tooling initialized successfully!');
  });
});
