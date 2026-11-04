import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authContext from '../../../context/AuthContext.tsx';
import * as useTransactionsHook from '../../../hooks/useTransactions.ts';
import { createMockTransaction } from '../../../test/factories.ts';
import { TransactionType } from '../../../types/transaction.ts';
import { Dashboard } from '../Dashboard.tsx';

vi.mock('../../../context/AuthContext.tsx', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../hooks/useTransactions.ts', () => ({
  useTransactions: vi.fn(),
}));

describe('Dashboard Component', () => {
  const mockLogout = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(authContext.useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      apiKey: 'test-api-key',
      login: vi.fn(),
      logout: mockLogout,
    });

    vi.mocked(useTransactionsHook.useTransactions).mockReturnValue({
      transactions: [],
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  it('renders the header with branding and logout button', () => {
    render(<Dashboard />);

    expect(screen.getByRole('heading', { name: /^coin$/i })).toBeInTheDocument();
    expect(screen.getByText('Personal Finance')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument();
  });

  it('calls logout when the user clicks the logout button', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    const logoutButton = screen.getByRole('button', { name: /sair/i });
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('renders MonthSelector and calls useTransactions with the selected month arguments', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const expectedInitial = { year: now.getFullYear(), month: now.getMonth() + 1 };
    const expectedNextMonth = expectedInitial.month === 12 ? 1 : expectedInitial.month + 1;
    const expectedNextYear =
      expectedInitial.month === 12 ? expectedInitial.year + 1 : expectedInitial.year;

    render(<Dashboard />);

    expect(screen.getByRole('navigation', { name: /navegação de mês/i })).toBeInTheDocument();
    expect(useTransactionsHook.useTransactions).toHaveBeenNthCalledWith(1, expectedInitial);

    const nextButton = screen.getByRole('button', { name: /próximo mês/i });
    await user.click(nextButton);

    // Initial render call + post-click navigation call with exact incremented month
    expect(useTransactionsHook.useTransactions).toHaveBeenCalledTimes(2);
    expect(useTransactionsHook.useTransactions).toHaveBeenNthCalledWith(2, {
      year: expectedNextYear,
      month: expectedNextMonth,
    });
  });

  it('renders MonthlySummary with transactions when data is available', () => {
    const mockTxs = [
      createMockTransaction({ amount: 3500, type: TransactionType.Income }),
      createMockTransaction({ amount: 1200, type: TransactionType.Expense }),
    ];

    vi.mocked(useTransactionsHook.useTransactions).mockReturnValue({
      transactions: mockTxs,
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<Dashboard />);

    expect(screen.getByTestId('summary-income')).toHaveTextContent('R$ 3.500,00');
    expect(screen.getByTestId('summary-expense')).toHaveTextContent('R$ 1.200,00');
    expect(screen.getByTestId('summary-balance')).toHaveTextContent('R$ 2.300,00');
    expect(screen.getByText(/2 transação\(ões\) encontrada\(s\)/i)).toBeInTheDocument();
  });

  it('renders loading skeleton when useTransactions reports isLoading=true', () => {
    vi.mocked(useTransactionsHook.useTransactions).mockReturnValue({
      transactions: undefined,
      isLoading: true,
      isFetching: true,
      isSuccess: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<Dashboard />);

    expect(screen.getByTestId('summary-skeleton')).toBeInTheDocument();
    expect(screen.getByText(/carregando movimentações/i)).toBeInTheDocument();
  });

  it('renders error banner and handles retry click when isError is true', async () => {
    const user = userEvent.setup();

    vi.mocked(useTransactionsHook.useTransactions).mockReturnValue({
      transactions: undefined,
      isLoading: false,
      isFetching: false,
      isSuccess: false,
      isError: true,
      error: new Error('Network error'),
      refetch: mockRefetch,
    });

    render(<Dashboard />);

    const errorBanner = screen.getByTestId('dashboard-error-banner');
    expect(errorBanner).toBeInTheDocument();
    expect(
      screen.getByText(/não foi possível carregar as transações deste mês/i),
    ).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
    expect(retryButton).not.toBeDisabled();
    expect(retryButton).toHaveAttribute('aria-busy', 'false');

    await user.click(retryButton);

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('disables retry button and displays reconnecting state while isFetching is true', () => {
    vi.mocked(useTransactionsHook.useTransactions).mockReturnValue({
      transactions: undefined,
      isLoading: false,
      isFetching: true,
      isSuccess: false,
      isError: true,
      error: new Error('Network error'),
      refetch: mockRefetch,
    });

    render(<Dashboard />);

    const retryButton = screen.getByRole('button', { name: /reconectando\.\.\./i });
    expect(retryButton).toBeDisabled();
    expect(retryButton).toHaveAttribute('aria-busy', 'true');
  });
});
