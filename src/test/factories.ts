import type { TransactionResponseDto } from '../types/transaction.ts';
import { TransactionCategory, TransactionType } from '../types/transaction.ts';

/**
 * Creates a mock TransactionResponseDto with sensible financial defaults.
 * Allows overriding any property for focused unit testing.
 */
export function createMockTransaction(
  overrides: Partial<TransactionResponseDto> = {},
): TransactionResponseDto {
  const type = overrides.type ?? TransactionType.Income;
  const amount = overrides.amount ?? 100;
  const signedAmount =
    overrides.signedAmount ?? (type === TransactionType.Expense ? -amount : amount);

  return {
    id: overrides.id ?? 'mock-tx-id',
    userId: overrides.userId ?? 'mock-user-id',
    description: overrides.description ?? 'Transação de Teste',
    amount,
    signedAmount,
    type,
    category: overrides.category ?? TransactionCategory.Other,
    date: overrides.date ?? '2026-10-15T12:00:00.000Z',
    createdAt: overrides.createdAt ?? '2026-10-15T12:00:00.000Z',
    ...overrides,
  };
}
