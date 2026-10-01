/**
 * Transaction type indicator matching backend enum serialization.
 */
export const TransactionType = {
  Income: 1,
  Expense: 2,
} as const;

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

/**
 * Category categorization matching backend enum serialization.
 */
export const TransactionCategory = {
  Food: 1,
  Housing: 2,
  Transportation: 3,
  Salary: 4,
  Health: 5,
  Leisure: 6,
  Education: 7,
  Other: 8,
} as const;

export type TransactionCategory = (typeof TransactionCategory)[keyof typeof TransactionCategory];

export interface CreateTransactionDto {
  description: string;
  amount: number;
  date: string; // ISO 8601 UTC string (e.g. "2026-09-24T12:00:00Z")
  type: TransactionType;
  category: TransactionCategory;
}

export type UpdateTransactionDto = CreateTransactionDto;

export interface TransactionResponseDto {
  id: string; // GUID
  userId: string; // GUID
  description: string;
  amount: number; // Positive decimal value
  date: string; // ISO 8601 UTC string
  type: TransactionType;
  category: TransactionCategory;
  signedAmount: number; // Positive for Income, Negative for Expense
  createdAt: string; // ISO 8601 UTC string
  updatedAt?: string;
}
