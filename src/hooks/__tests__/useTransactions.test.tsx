import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as transactionsApi from '../../api/transactions.ts';
import type { TransactionResponseDto } from '../../types/transaction.ts';
import { TransactionCategory, TransactionType } from '../../types/transaction.ts';
import { useTransactions } from '../useTransactions.ts';

vi.mock('../../api/transactions.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/transactions.ts')>();
  return {
    ...actual,
    getTransactions: vi.fn(),
  };
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useTransactions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData: TransactionResponseDto[] = [
    {
      id: 'tx-1',
      userId: 'user-1',
      description: 'Salário',
      amount: 5000,
      signedAmount: 5000,
      type: TransactionType.Income,
      category: TransactionCategory.Salary,
      date: '2026-10-05T10:00:00.000Z',
      createdAt: '2026-10-05T10:00:00.000Z',
    },
  ];

  it('fetches transactions for the specified year and month on initial render', async () => {
    vi.mocked(transactionsApi.getTransactions).mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useTransactions({ year: 2026, month: 10 }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.transactions).toEqual(mockData);
    expect(transactionsApi.getTransactions).toHaveBeenCalledTimes(1);
    expect(transactionsApi.getTransactions).toHaveBeenCalledWith(
      '2026-10-01T00:00:00.000Z',
      '2026-10-31T23:59:59.999Z',
    );
  });

  it('refetches when year or month parameter changes', async () => {
    const octData: TransactionResponseDto[] = [...mockData];
    const novData: TransactionResponseDto[] = [
      {
        ...mockData[0],
        id: 'tx-2',
        description: 'Bônus',
        date: '2026-11-01T10:00:00.000Z',
      },
    ];

    vi.mocked(transactionsApi.getTransactions)
      .mockResolvedValueOnce(octData)
      .mockResolvedValueOnce(novData);

    const { result, rerender } = renderHook(({ year, month }) => useTransactions({ year, month }), {
      initialProps: { year: 2026, month: 10 },
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.transactions).toEqual(octData);

    // Switch month to November
    rerender({ year: 2026, month: 11 });

    await waitFor(() => {
      expect(result.current.transactions).toEqual(novData);
    });

    expect(transactionsApi.getTransactions).toHaveBeenCalledTimes(2);
    expect(transactionsApi.getTransactions).toHaveBeenLastCalledWith(
      '2026-11-01T00:00:00.000Z',
      '2026-11-30T23:59:59.999Z',
    );
  });

  it('exposes isError and error details when query fails', async () => {
    const networkError = new Error('Network timeout during container cold start');
    vi.mocked(transactionsApi.getTransactions).mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useTransactions({ year: 2026, month: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(networkError);
    expect(result.current.transactions).toBeUndefined();
  });
});
