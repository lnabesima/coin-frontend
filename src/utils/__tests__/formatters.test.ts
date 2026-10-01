import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionType } from '../../types/transaction.ts';
import {
  formatCurrency,
  formatDate,
  formatDayHeader,
  formatMonthHeader,
  formatSignedCurrency,
} from '../formatters.ts';

/**
 * Normalizes non-breaking spaces (\u00A0 or \u202F) to standard space for reliable test assertions.
 */
function normalizeSpace(value: string): string {
  return value.replace(/[\u00A0\u202F]/g, ' ');
}

describe('Formatters Utility', () => {
  describe('formatCurrency', () => {
    it('formats positive currency amounts into BRL format', () => {
      expect(normalizeSpace(formatCurrency(150.5))).toBe('R$ 150,50');
      expect(normalizeSpace(formatCurrency(1234.56))).toBe('R$ 1.234,56');
    });

    it('formats zero correctly', () => {
      expect(normalizeSpace(formatCurrency(0))).toBe('R$ 0,00');
    });

    it('formats negative amounts', () => {
      expect(normalizeSpace(formatCurrency(-42.5))).toBe('-R$ 42,50');
    });

    it('handles floating point precision anomalies (0.1 + 0.2)', () => {
      expect(normalizeSpace(formatCurrency(0.1 + 0.2))).toBe('R$ 0,30');
    });

    it('throws TypeError for non-finite numbers and NaN', () => {
      expect(() => formatCurrency(Number.NaN)).toThrow(TypeError);
      expect(() => formatCurrency(Number.POSITIVE_INFINITY)).toThrow(TypeError);
      expect(() => formatCurrency(Number.NEGATIVE_INFINITY)).toThrow(TypeError);
    });
  });

  describe('formatSignedCurrency', () => {
    it('prefixes Income with a plus sign', () => {
      const result = normalizeSpace(formatSignedCurrency(150, TransactionType.Income));
      expect(result).toBe('+ R$ 150,00');
    });

    it('prefixes Expense with a minus sign', () => {
      const result = normalizeSpace(formatSignedCurrency(42.5, TransactionType.Expense));
      expect(result).toBe('- R$ 42,50');
    });

    it('handles negative inputs without producing double negatives', () => {
      const result = normalizeSpace(formatSignedCurrency(-42.5, TransactionType.Expense));
      expect(result).toBe('- R$ 42,50');
    });

    it('returns neutral unsigned zero for zero amounts and sub-cent dust', () => {
      expect(normalizeSpace(formatSignedCurrency(0, TransactionType.Expense))).toBe('R$ 0,00');
      expect(normalizeSpace(formatSignedCurrency(0, TransactionType.Income))).toBe('R$ 0,00');
      expect(normalizeSpace(formatSignedCurrency(-0.001, TransactionType.Expense))).toBe('R$ 0,00');
      expect(normalizeSpace(formatSignedCurrency(0.001, TransactionType.Income))).toBe('R$ 0,00');
    });

    it('throws TypeError for non-finite numbers and NaN', () => {
      expect(() => formatSignedCurrency(Number.NaN, TransactionType.Income)).toThrow(TypeError);
      expect(() => formatSignedCurrency(Number.POSITIVE_INFINITY, TransactionType.Expense)).toThrow(
        TypeError,
      );
    });
  });

  describe('formatDate', () => {
    it('formats ISO strings into DD/MM/YYYY format', () => {
      expect(formatDate('2026-09-24T12:00:00Z')).toBe('24/09/2026');
      expect(formatDate('2026-01-05T00:00:00Z')).toBe('05/01/2026');
      expect(formatDate('2026-09-24')).toBe('24/09/2026');
    });

    it('formats UTC Date instances timezone-independently', () => {
      const utcDate = new Date(Date.UTC(2026, 8, 24, 12, 0, 0));
      expect(formatDate(utcDate)).toBe('24/09/2026');
    });

    it('throws RangeError for invalid date inputs', () => {
      expect(() => formatDate('invalid-date')).toThrow(RangeError);
      expect(() => formatDate(new Date('invalid'))).toThrow(RangeError);
      expect(() => formatDate('')).toThrow(RangeError);
    });
  });

  describe('formatDayHeader', () => {
    // Explicit UTC reference: 2026-09-25T12:00:00Z
    const reference = new Date(Date.UTC(2026, 8, 25, 12, 0, 0));

    it('returns "Hoje" when target date is the same calendar day', () => {
      expect(formatDayHeader('2026-09-25T12:00:00Z', reference)).toBe('Hoje');
      expect(formatDayHeader(reference, reference)).toBe('Hoje');
    });

    it('returns "Ontem" when target date is yesterday', () => {
      const yesterdayUtc = new Date(Date.UTC(2026, 8, 24, 12, 0, 0));
      expect(formatDayHeader('2026-09-24T12:00:00Z', reference)).toBe('Ontem');
      expect(formatDayHeader(yesterdayUtc, reference)).toBe('Ontem');
    });

    it('returns full localized date string for older dates', () => {
      const result = formatDayHeader('2026-09-20T12:00:00Z', reference);
      expect(result).toBe('20 de setembro de 2026');
    });

    describe('when referenceDate is omitted (system time freeze)', () => {
      beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-09-25T12:00:00Z'));
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('evaluates "Hoje" and "Ontem" deterministically against frozen system time', () => {
        expect(formatDayHeader('2026-09-25T12:00:00Z')).toBe('Hoje');
        expect(formatDayHeader('2026-09-24T12:00:00Z')).toBe('Ontem');
        expect(formatDayHeader('2026-09-20T12:00:00Z')).toBe('20 de setembro de 2026');
      });
    });

    it('throws RangeError for invalid dates', () => {
      expect(() => formatDayHeader('invalid')).toThrow(RangeError);
      expect(() => formatDayHeader(new Date('invalid'))).toThrow(RangeError);
      expect(() => formatDayHeader('2026-09-25T12:00:00Z', 'invalid')).toThrow(RangeError);
    });
  });

  describe('formatMonthHeader', () => {
    it('formats capitalized month and year in PT-BR', () => {
      expect(formatMonthHeader('2026-09-15T12:00:00Z')).toBe('Setembro de 2026');
      expect(formatMonthHeader(new Date(Date.UTC(2026, 0, 10)))).toBe('Janeiro de 2026');
    });

    it('throws RangeError for invalid date inputs', () => {
      expect(() => formatMonthHeader('invalid')).toThrow(RangeError);
      expect(() => formatMonthHeader(new Date('invalid'))).toThrow(RangeError);
      expect(() => formatMonthHeader('')).toThrow(RangeError);
    });
  });
});
