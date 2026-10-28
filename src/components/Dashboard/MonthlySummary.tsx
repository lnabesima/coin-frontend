import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { TransactionResponseDto } from '../../types/transaction.ts';
import { TransactionType } from '../../types/transaction.ts';
import { formatCurrency } from '../../utils/formatters.ts';

export interface MonthlySummaryProps {
  transactions?: TransactionResponseDto[];
  isLoading?: boolean;
}

export function MonthlySummary({ transactions, isLoading }: MonthlySummaryProps) {
  if (isLoading) {
    return (
      <section
        data-testid="summary-skeleton"
        aria-label="Carregando resumo do mês"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {[1, 2, 3].map((key) => (
          <div
            key={key}
            className="h-24 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4 animate-pulse"
          />
        ))}
      </section>
    );
  }

  const list = transactions ?? [];

  const totalIncome = list.reduce(
    (acc, tx) => (tx.type === TransactionType.Income ? acc + tx.amount : acc),
    0,
  );

  const totalExpenses = list.reduce(
    (acc, tx) => (tx.type === TransactionType.Expense ? acc + tx.amount : acc),
    0,
  );

  const netBalance = totalIncome - totalExpenses;

  const isNeutral = Math.abs(netBalance) < 0.005;
  const isPositive = !isNeutral && netBalance > 0;

  const balanceColorClass = isNeutral
    ? 'text-zinc-400'
    : isPositive
      ? 'text-emerald-400'
      : 'text-rose-400';

  return (
    <section aria-label="Resumo do mês" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Receitas */}
      <div
        data-testid="summary-income"
        className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 shadow-sm backdrop-blur flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">
          <span>Receitas</span>
          <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <TrendingUp className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-semibold tracking-tight text-emerald-400">
          {formatCurrency(totalIncome)}
        </p>
      </div>

      {/* Despesas */}
      <div
        data-testid="summary-expense"
        className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 shadow-sm backdrop-blur flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">
          <span>Despesas</span>
          <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
            <TrendingDown className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-semibold tracking-tight text-rose-400">
          {formatCurrency(totalExpenses)}
        </p>
      </div>

      {/* Balanço */}
      <div
        data-testid="summary-balance"
        className={`bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 shadow-sm backdrop-blur flex flex-col justify-between ${balanceColorClass}`}
      >
        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">
          <span>Balanço</span>
          <div className="p-1.5 bg-zinc-800/80 border border-zinc-700/50 rounded-lg text-zinc-300">
            <Wallet className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
        <p className={`text-xl sm:text-2xl font-semibold tracking-tight ${balanceColorClass}`}>
          {formatCurrency(isNeutral ? 0 : netBalance)}
        </p>
      </div>
    </section>
  );
}
