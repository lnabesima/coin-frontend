import { useQuery } from '@tanstack/react-query';
import { getTransactions, getUtcMonthRange } from '../api/transactions.ts';
import type { TransactionResponseDto } from '../types/transaction.ts';

export interface UseTransactionsParams {
  year: number;
  month: number; // 1-12 (human month)
}

export function useTransactions({ year, month }: UseTransactionsParams) {
  const { startDate, endDate } = getUtcMonthRange(year, month);

  const query = useQuery({
    queryKey: ['transactions', { year, month }],
    queryFn: () => getTransactions(startDate, endDate),
  });

  return {
    transactions: query.data as TransactionResponseDto[] | undefined,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
