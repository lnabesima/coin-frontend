import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Car,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  Home,
  Package,
  UtensilsCrossed,
} from 'lucide-react';
import { TransactionCategory } from '../types/transaction.ts';

export interface CategoryMetadata {
  id: TransactionCategory;
  name: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  badgeClass: string;
}

export const categoryMap: Readonly<Record<TransactionCategory, CategoryMetadata>> = {
  [TransactionCategory.Food]: {
    id: TransactionCategory.Food,
    name: 'Alimentação',
    icon: UtensilsCrossed,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    badgeClass: 'text-amber-500 bg-amber-500/10',
  },
  [TransactionCategory.Housing]: {
    id: TransactionCategory.Housing,
    name: 'Moradia',
    icon: Home,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    badgeClass: 'text-blue-500 bg-blue-500/10',
  },
  [TransactionCategory.Transportation]: {
    id: TransactionCategory.Transportation,
    name: 'Transporte',
    icon: Car,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    badgeClass: 'text-purple-500 bg-purple-500/10',
  },
  [TransactionCategory.Salary]: {
    id: TransactionCategory.Salary,
    name: 'Salário',
    icon: Briefcase,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    badgeClass: 'text-emerald-500 bg-emerald-500/10',
  },
  [TransactionCategory.Health]: {
    id: TransactionCategory.Health,
    name: 'Saúde',
    icon: HeartPulse,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    badgeClass: 'text-rose-500 bg-rose-500/10',
  },
  [TransactionCategory.Leisure]: {
    id: TransactionCategory.Leisure,
    name: 'Lazer',
    icon: Gamepad2,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    badgeClass: 'text-cyan-500 bg-cyan-500/10',
  },
  [TransactionCategory.Education]: {
    id: TransactionCategory.Education,
    name: 'Educação',
    icon: GraduationCap,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    badgeClass: 'text-violet-500 bg-violet-500/10',
  },
  [TransactionCategory.Other]: {
    id: TransactionCategory.Other,
    name: 'Outros',
    icon: Package,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-400/10',
    badgeClass: 'text-zinc-400 bg-zinc-400/10',
  },
};

const validCategoryIds = new Set<number>(Object.values(TransactionCategory));

/**
 * Type guard to check if an arbitrary value is a valid TransactionCategory.
 */
export function isTransactionCategory(value: unknown): value is TransactionCategory {
  return typeof value === 'number' && validCategoryIds.has(value);
}

/**
 * Retrieves UI metadata for a given category.
 * Throws RangeError if an invalid or unrecognized category number is provided.
 */
export function getCategoryMeta(category: TransactionCategory | number): CategoryMetadata {
  if (!isTransactionCategory(category)) {
    throw new RangeError(`Invalid transaction category: received ${category}`);
  }
  return categoryMap[category];
}

/**
 * Returns an ordered array of all category metadata, convenient for form selects and filter options.
 */
export function getAllCategories(): CategoryMetadata[] {
  return Object.values(categoryMap);
}
