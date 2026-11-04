import { ArrowLeft, CheckCircle2, Eye, Flame, RefreshCw, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { TransactionResponseDto } from '../../types/transaction.ts';
import { TransactionCategory, TransactionType } from '../../types/transaction.ts';
import { MonthlySummary } from '../Dashboard/MonthlySummary.tsx';
import { MonthSelector } from '../Dashboard/MonthSelector.tsx';

const mockHealthyTransactions: TransactionResponseDto[] = [
  {
    id: '1',
    userId: 'u1',
    description: 'Salário Mensal',
    amount: 5400,
    signedAmount: 5400,
    date: '2026-10-05T10:00:00Z',
    type: TransactionType.Income,
    category: TransactionCategory.Salary,
    createdAt: '2026-10-05T10:00:00Z',
  },
  {
    id: '2',
    userId: 'u1',
    description: 'Supermercado',
    amount: 1450,
    signedAmount: -1450,
    date: '2026-10-10T15:30:00Z',
    type: TransactionType.Expense,
    category: TransactionCategory.Food,
    createdAt: '2026-10-10T15:30:00Z',
  },
  {
    id: '3',
    userId: 'u1',
    description: 'Energia Elétrica',
    amount: 700,
    signedAmount: -700,
    date: '2026-10-15T18:00:00Z',
    type: TransactionType.Expense,
    category: TransactionCategory.Housing,
    createdAt: '2026-10-15T18:00:00Z',
  },
];

const mockDeficitTransactions: TransactionResponseDto[] = [
  {
    id: '4',
    userId: 'u1',
    description: 'Freelance Design',
    amount: 1200,
    signedAmount: 1200,
    date: '2026-10-02T12:00:00Z',
    type: TransactionType.Income,
    category: TransactionCategory.Salary,
    createdAt: '2026-10-02T12:00:00Z',
  },
  {
    id: '5',
    userId: 'u1',
    description: 'Aluguel',
    amount: 2200,
    signedAmount: -2200,
    date: '2026-10-05T09:00:00Z',
    type: TransactionType.Expense,
    category: TransactionCategory.Housing,
    createdAt: '2026-10-05T09:00:00Z',
  },
  {
    id: '6',
    userId: 'u1',
    description: 'Manutenção do Carro',
    amount: 650,
    signedAmount: -650,
    date: '2026-10-18T14:00:00Z',
    type: TransactionType.Expense,
    category: TransactionCategory.Transportation,
    createdAt: '2026-10-18T14:00:00Z',
  },
];

type Scenario = 'healthy' | 'deficit' | 'empty';

export interface ComponentPlaygroundProps {
  onClose?: () => void;
}

export function ComponentPlayground({ onClose }: ComponentPlaygroundProps) {
  const [selectedDate, setSelectedDate] = useState({ year: 2026, month: 10 });
  const [scenario, setScenario] = useState<Scenario>('healthy');
  const [isLoading, setIsLoading] = useState(false);

  const getScenarioTransactions = (): TransactionResponseDto[] => {
    switch (scenario) {
      case 'healthy':
        return mockHealthyTransactions;
      case 'deficit':
        return mockDeficitTransactions;
      case 'empty':
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8">
      <header className="max-w-4xl mx-auto flex items-center justify-between pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-xl transition cursor-pointer"
              aria-label="Voltar para a aplicação"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md">
                Dev Workbench
              </span>
              <h1 className="text-xl font-bold tracking-tight">Component Isolation Sandbox</h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Test and inspect isolated component states without third-party UI libraries or
              Storybook.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 space-y-10">
        {/* Controls Toolbar */}
        <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 backdrop-blur space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-400" />
            Interactive State Controls
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Loading Toggle */}
            <button
              type="button"
              onClick={() => setIsLoading(!isLoading)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer border ${
                isLoading
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Skeleton Loading: {isLoading ? 'ON (Pulsing)' : 'OFF'}</span>
            </button>

            {/* Scenario Buttons */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setScenario('healthy')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  scenario === 'healthy'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Healthy Month (+R$ 3.250)</span>
              </button>

              <button
                type="button"
                onClick={() => setScenario('deficit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  scenario === 'deficit'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Deficit Month (-R$ 1.650)</span>
              </button>

              <button
                type="button"
                onClick={() => setScenario('empty')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  scenario === 'empty'
                    ? 'bg-zinc-700 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Empty (R$ 0,00)</span>
              </button>
            </div>
          </div>
        </section>

        {/* Section 1: MonthSelector */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">1. MonthSelector Component</h2>
              <p className="text-xs text-zinc-400">
                Independent navigator keeping UTC month boundaries safe from timezone shifts.
              </p>
            </div>
            <div className="text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg text-zinc-300">
              State: year={selectedDate.year}, month={selectedDate.month}
            </div>
          </div>

          <div className="max-w-xs">
            <MonthSelector
              year={selectedDate.year}
              month={selectedDate.month}
              onMonthChange={setSelectedDate}
            />
          </div>
        </section>

        {/* Section 2: MonthlySummary */}
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">2. MonthlySummary Component</h2>
            <p className="text-xs text-zinc-400">
              Shows loading pulse when{' '}
              <code className="text-amber-400 font-mono">isLoading=true</code>, or calculates
              Balance, Income, and Expenses cards.
            </p>
          </div>

          <MonthlySummary transactions={getScenarioTransactions()} isLoading={isLoading} />
        </section>

        {/* Section 3: Live Composite View */}
        <section className="space-y-4 pt-6 border-t border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">3. Composite Mock Layout</h2>
            <p className="text-xs text-zinc-400">
              How they stack together inside a typical mobile viewport container (max-w-md).
            </p>
          </div>

          <div className="w-full max-w-md mx-auto bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <MonthSelector
              year={selectedDate.year}
              month={selectedDate.month}
              onMonthChange={setSelectedDate}
            />

            <MonthlySummary transactions={getScenarioTransactions()} isLoading={isLoading} />
          </div>
        </section>
      </main>
    </div>
  );
}
