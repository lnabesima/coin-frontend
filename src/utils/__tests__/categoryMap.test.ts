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
import { describe, expect, it } from 'vitest';
import { TransactionCategory } from '../../types/transaction.ts';
import {
  categoryMap,
  getAllCategories,
  getCategoryMeta,
  isTransactionCategory,
} from '../categoryMap.ts';

describe('Category Map Utility', () => {
  describe('categoryMap', () => {
    it('defines metadata for all 8 standard TransactionCategory values', () => {
      const categoryValues = Object.values(TransactionCategory);
      expect(categoryValues).toHaveLength(8);

      for (const catId of categoryValues) {
        const meta = categoryMap[catId];
        expect(meta).toBeDefined();
        expect(meta.id).toBe(catId);
        expect(typeof meta.name).toBe('string');
        expect(meta.name.length).toBeGreaterThan(0);
        expect(meta.icon).toBeDefined();
        expect(meta.color).toMatch(/^text-/);
        expect(meta.bgColor).toMatch(/^bg-/);
        expect(meta.badgeClass).toContain(meta.color);
        expect(meta.badgeClass).toContain(meta.bgColor);
      }
    });

    it('maps each category to its expected PT-BR label and Lucide icon', () => {
      expect(categoryMap[TransactionCategory.Food].name).toBe('Alimentação');
      expect(categoryMap[TransactionCategory.Food].icon).toBe(UtensilsCrossed);

      expect(categoryMap[TransactionCategory.Housing].name).toBe('Moradia');
      expect(categoryMap[TransactionCategory.Housing].icon).toBe(Home);

      expect(categoryMap[TransactionCategory.Transportation].name).toBe('Transporte');
      expect(categoryMap[TransactionCategory.Transportation].icon).toBe(Car);

      expect(categoryMap[TransactionCategory.Salary].name).toBe('Salário');
      expect(categoryMap[TransactionCategory.Salary].icon).toBe(Briefcase);

      expect(categoryMap[TransactionCategory.Health].name).toBe('Saúde');
      expect(categoryMap[TransactionCategory.Health].icon).toBe(HeartPulse);

      expect(categoryMap[TransactionCategory.Leisure].name).toBe('Lazer');
      expect(categoryMap[TransactionCategory.Leisure].icon).toBe(Gamepad2);

      expect(categoryMap[TransactionCategory.Education].name).toBe('Educação');
      expect(categoryMap[TransactionCategory.Education].icon).toBe(GraduationCap);

      expect(categoryMap[TransactionCategory.Other].name).toBe('Outros');
      expect(categoryMap[TransactionCategory.Other].icon).toBe(Package);
    });
  });

  describe('getCategoryMeta', () => {
    it('returns the correct metadata for a valid category', () => {
      const meta = getCategoryMeta(TransactionCategory.Food);
      expect(meta.name).toBe('Alimentação');
      expect(meta.id).toBe(TransactionCategory.Food);
    });

    it('throws RangeError for unknown or invalid category numbers', () => {
      expect(() => getCategoryMeta(999)).toThrow(RangeError);
      expect(() => getCategoryMeta(0)).toThrow(RangeError);
      expect(() => getCategoryMeta(-1)).toThrow(RangeError);
    });
  });

  describe('isTransactionCategory', () => {
    it('returns true for valid category numeric values', () => {
      expect(isTransactionCategory(TransactionCategory.Food)).toBe(true);
      expect(isTransactionCategory(TransactionCategory.Other)).toBe(true);
      expect(isTransactionCategory(1)).toBe(true);
      expect(isTransactionCategory(8)).toBe(true);
    });

    it('returns false for invalid category values and non-number types', () => {
      expect(isTransactionCategory(0)).toBe(false);
      expect(isTransactionCategory(9)).toBe(false);
      expect(isTransactionCategory(-1)).toBe(false);
      expect(isTransactionCategory('1')).toBe(false);
      expect(isTransactionCategory(null)).toBe(false);
      expect(isTransactionCategory(undefined)).toBe(false);
      expect(isTransactionCategory({})).toBe(false);
    });
  });

  describe('getAllCategories', () => {
    it('returns an array containing all 8 categories', () => {
      const all = getAllCategories();
      expect(all).toHaveLength(8);
      expect(all.map((c) => c.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
  });
});
