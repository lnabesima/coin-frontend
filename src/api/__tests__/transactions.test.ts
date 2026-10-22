import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransactionResponseDto } from '../../types/transaction.ts';
import { TransactionCategory, TransactionType } from '../../types/transaction.ts';
import { apiClient } from '../client.ts';
import { createApiError } from '../errors.ts';
import { getTransactions, getUtcMonthRange } from '../transactions.ts';

vi.mock('../client.ts', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('Transactions API Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUtcMonthRange', () => {
    it('returns exact UTC ISO strings for a 31-day month (October 2026)', () => {
      const { startDate, endDate } = getUtcMonthRange(2026, 10);
      expect(startDate).toBe('2026-10-01T00:00:00.000Z');
      expect(endDate).toBe('2026-10-31T23:59:59.999Z');
    });

    it('returns exact UTC ISO strings for a 30-day month (September 2026)', () => {
      const { startDate, endDate } = getUtcMonthRange(2026, 9);
      expect(startDate).toBe('2026-09-01T00:00:00.000Z');
      expect(endDate).toBe('2026-09-30T23:59:59.999Z');
    });

    it('handles February in non-leap year (2026 -> 28 days)', () => {
      const { startDate, endDate } = getUtcMonthRange(2026, 2);
      expect(startDate).toBe('2026-02-01T00:00:00.000Z');
      expect(endDate).toBe('2026-02-28T23:59:59.999Z');
    });

    it('handles February in leap year (2024 -> 29 days)', () => {
      const { startDate, endDate } = getUtcMonthRange(2024, 2);
      expect(startDate).toBe('2024-02-01T00:00:00.000Z');
      expect(endDate).toBe('2024-02-29T23:59:59.999Z');
    });

    it('throws RangeError for invalid month numbers (< 1 or > 12)', () => {
      expect(() => getUtcMonthRange(2026, 0)).toThrow(RangeError);
      expect(() => getUtcMonthRange(2026, 13)).toThrow(RangeError);
      expect(() => getUtcMonthRange(2026, -1)).toThrow(RangeError);
    });
  });

  describe('getTransactions', () => {
    const mockTransactions: TransactionResponseDto[] = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        userId: '22222222-2222-2222-2222-222222222222',
        description: 'Supermercado',
        amount: 250.75,
        signedAmount: -250.75,
        type: TransactionType.Expense,
        category: TransactionCategory.Food,
        date: '2026-10-15T14:30:00.000Z',
        createdAt: '2026-10-15T14:30:00.000Z',
      },
    ];

    it('calls GET api/v1/transactions with startDate and endDate search params', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockTransactions);

      const result = await getTransactions('2026-10-01T00:00:00.000Z', '2026-10-31T23:59:59.999Z');

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('api/v1/transactions', {
        searchParams: {
          startDate: '2026-10-01T00:00:00.000Z',
          endDate: '2026-10-31T23:59:59.999Z',
        },
      });
      expect(result).toEqual(mockTransactions);
    });

    it('omits searchParams when startDate and endDate are not provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce([]);

      const result = await getTransactions();

      expect(apiClient.get).toHaveBeenCalledWith('api/v1/transactions', {
        searchParams: undefined,
      });
      expect(result).toEqual([]);
    });

    it('propagates ApiError when backend returns a 401 Unauthorized', async () => {
      const error401 = createApiError({
        status: 401,
        title: 'Unauthorized',
        detail: 'Invalid API Key',
      });
      vi.mocked(apiClient.get).mockRejectedValueOnce(error401);

      await expect(getTransactions()).rejects.toThrow('Invalid API Key');
    });
  });
});
