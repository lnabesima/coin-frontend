import { TZDate } from '@date-fns/tz';
import { endOfMonth, isExists, startOfMonth } from 'date-fns';
import type { TransactionResponseDto } from '../types/transaction.ts';
import { apiClient } from './client.ts';

export interface MonthRange {
  startDate: string;
  endDate: string;
}

/**
 * Calculates start and end of a calendar month in strict UTC ISO 8601 format using date-fns and @date-fns/tz.
 *
 * @param year - Full calendar year (e.g. 2026)
 * @param month - Calendar month index from 1 (January) to 12 (December)
 * @returns MonthRange containing startDate and endDate ISO strings
 */
export function getUtcMonthRange(year: number, month: number): MonthRange {
  const monthIndex = month - 1;

  if (!isExists(year, monthIndex, 1)) {
    throw new RangeError(`Invalid calendar month: ${month} in year ${year}`);
  }

  const anchor = new TZDate(year, monthIndex, 1, 'UTC');
  const start = startOfMonth(anchor);
  const end = endOfMonth(anchor);

  return {
    startDate: new Date(start.getTime()).toISOString(),
    endDate: new Date(end.getTime()).toISOString(),
  };
}

/**
 * Fetches transactions from the backend with optional date range bounds.
 *
 * @param startDate - Optional ISO 8601 UTC lower bound
 * @param endDate - Optional ISO 8601 UTC upper bound
 * @returns Array of transaction response DTOs
 */
export async function getTransactions(
  startDate?: string,
  endDate?: string,
): Promise<TransactionResponseDto[]> {
  const searchParams: Record<string, string> = {};

  if (startDate && startDate.trim().length > 0) {
    searchParams.startDate = startDate.trim();
  }
  if (endDate && endDate.trim().length > 0) {
    searchParams.endDate = endDate.trim();
  }

  const hasParams = Object.keys(searchParams).length > 0;

  return apiClient.get<TransactionResponseDto[]>('api/v1/transactions', {
    searchParams: hasParams ? searchParams : undefined,
  });
}
