import { AlertCircle, LogOut, RefreshCw, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTransactions } from '../../hooks/useTransactions.ts';
import { MonthlySummary } from './MonthlySummary.tsx';
import { MonthSelector } from './MonthSelector.tsx';

function getFeedStatusMessage(isLoading: boolean, isError: boolean, count?: number): string {
  if (isLoading) return 'Carregando movimentações...';
  if (isError) return 'Erro ao carregar movimentações.';
  if (!count) return 'Nenhuma transação encontrada neste mês.';
  return `${count} transação(ões) encontrada(s).`;
}

export function Dashboard() {
  const { logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    };
  });

  const { transactions, isLoading, isFetching, isError, refetch } = useTransactions(selectedDate);
  const feedStatusMessage = getFeedStatusMessage(isLoading, isError, transactions?.length);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Wallet className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-100 leading-tight">
                Coin
              </h1>
              <p className="text-xs text-zinc-400">Personal Finance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Sair"
            className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition duration-150 cursor-pointer"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>

        {/* Temporal Anchor: Month Selector */}
        <MonthSelector
          year={selectedDate.year}
          month={selectedDate.month}
          onMonthChange={setSelectedDate}
        />

        {/* Error Banner (Terminal Failure) */}
        {isError && (
          <aside
            data-testid="dashboard-error-banner"
            role="alert"
            className="flex items-center justify-between gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm backdrop-blur"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" aria-hidden="true" />
              <span>Não foi possível carregar as transações deste mês.</span>
            </div>
            <button
              type="button"
              disabled={isFetching}
              aria-busy={isFetching}
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 active:bg-rose-500/40 text-rose-200 text-xs font-medium rounded-xl transition cursor-pointer shrink-0 border border-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{isFetching ? 'Reconectando...' : 'Tentar novamente'}</span>
            </button>
          </aside>
        )}

        {/* Monthly Summary Cards (Income, Expenses, Net Balance) */}
        <MonthlySummary transactions={transactions} isLoading={isLoading} />

        {/* Transaction Feed Slot / Placeholder */}
        <section
          aria-label="Transações do mês"
          className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 text-center text-zinc-400 text-sm space-y-1"
        >
          <p className="text-zinc-300 font-medium">Feed de Transações</p>
          <p className="text-xs text-zinc-500">{feedStatusMessage}</p>
        </section>
      </div>
    </main>
  );
}
