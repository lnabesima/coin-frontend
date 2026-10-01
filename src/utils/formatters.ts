import { tz } from '@date-fns/tz';
import { format, isSameDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TransactionType } from '../types/transaction.ts';

const utc = tz('UTC');

/**
 * Asserts that the given input represents a valid Date instance or parseable date string,
 * returning the parsed Date instance.
 * Throws RangeError if the date is invalid or unparseable.
 */
function assertValidDate(dateInput: Date | string): Date {
  if (dateInput instanceof Date && !Number.isNaN(dateInput.getTime())) {
    return dateInput;
  }

  const parsed =
    typeof dateInput === 'string' && dateInput.trim().length > 0 ? new Date(dateInput) : null;

  if (parsed && !Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  throw new RangeError(`Invalid date: received "${dateInput}"`);
}

/**
 * Formats a numeric value into Brazilian Real (BRL) currency format (e.g. "R$ 150,50").
 * Throws TypeError for non-finite or NaN inputs.
 */
export function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new TypeError(`Invalid currency amount: expected a finite number, received ${amount}`);
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

/**
 * Formats a currency value with an explicit sign depending on transaction type:
 * - Income: "+ R$ 150,00"
 * - Expense: "- R$ 42,50"
 * - Zero amounts (or values rounding to zero) are returned neutral: "R$ 0,00"
 * Throws TypeError for non-finite or NaN inputs.
 */
export function formatSignedCurrency(amount: number, type: TransactionType): string {
  if (!Number.isFinite(amount)) {
    throw new TypeError(`Invalid currency amount: expected a finite number, received ${amount}`);
  }

  if (Math.abs(amount) < 0.005) {
    return formatCurrency(0);
  }

  const formatted = formatCurrency(Math.abs(amount));
  return type === TransactionType.Income ? `+ ${formatted}` : `- ${formatted}`;
}

/**
 * Formats a date into localized "DD/MM/YYYY" format in UTC.
 * Throws RangeError for invalid dates.
 */
export function formatDate(dateInput: Date | string): string {
  const date = assertValidDate(dateInput);
  return format(date, 'dd/MM/yyyy', { in: utc });
}

/**
 * Formats a date header with smart relative labels:
 * - "Hoje" for current calendar day
 * - "Ontem" for the previous calendar day
 * - "DD de [mês] de AAAA" for earlier dates (e.g. "24 de setembro de 2026")
 * Throws RangeError for invalid dates.
 */
export function formatDayHeader(
  dateInput: Date | string,
  referenceDate: Date | string = new Date(),
): string {
  const targetDate = assertValidDate(dateInput);
  const refDate = assertValidDate(referenceDate);

  if (isSameDay(targetDate, refDate, { in: utc })) {
    return 'Hoje';
  }

  const yesterday = subDays(refDate, 1, { in: utc });
  if (isSameDay(targetDate, yesterday, { in: utc })) {
    return 'Ontem';
  }

  return format(targetDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR, in: utc });
}

/**
 * Formats a month into a capitalized title header in UTC (e.g. "Setembro de 2026").
 * Throws RangeError for invalid dates.
 */
export function formatMonthHeader(dateInput: Date | string): string {
  const date = assertValidDate(dateInput);

  const formatted = format(date, "MMMM 'de' yyyy", {
    locale: ptBR,
    in: utc,
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
