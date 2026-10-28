import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createMockTransaction } from '../../../test/factories.ts';
import { TransactionType } from '../../../types/transaction.ts';
import { MonthlySummary } from '../MonthlySummary.tsx';

describe('MonthlySummary Component', () => {
  it('calculates and displays total income, total expenses, and positive net balance', () => {
    const transactions = [
      createMockTransaction({ amount: 5000, type: TransactionType.Income }),
      createMockTransaction({ amount: 1500, type: TransactionType.Income }),
      createMockTransaction({ amount: 1200, type: TransactionType.Expense }),
      createMockTransaction({ amount: 800, type: TransactionType.Expense }),
    ];

    render(<MonthlySummary transactions={transactions} />);

    // Receitas: 5000 + 1500 = 6500 -> R$ 6.500,00
    const incomeCard = screen.getByTestId('summary-income');
    expect(incomeCard).toHaveTextContent(/receitas/i);
    expect(incomeCard).toHaveTextContent('R$ 6.500,00');

    // Despesas: 1200 + 800 = 2000 -> R$ 2.000,00
    const expenseCard = screen.getByTestId('summary-expense');
    expect(expenseCard).toHaveTextContent(/despesas/i);
    expect(expenseCard).toHaveTextContent('R$ 2.000,00');

    // Balanço: 6500 - 2000 = +4500 -> R$ 4.500,00
    const balanceCard = screen.getByTestId('summary-balance');
    expect(balanceCard).toHaveTextContent(/balanço/i);
    expect(balanceCard).toHaveTextContent('R$ 4.500,00');
    expect(balanceCard).toHaveClass('text-emerald-400');
  });

  it('displays negative net balance with rose/red accent when expenses exceed income', () => {
    const deficitTransactions = [
      createMockTransaction({ amount: 500, type: TransactionType.Income }),
      createMockTransaction({ amount: 2000, type: TransactionType.Expense }),
    ];

    render(<MonthlySummary transactions={deficitTransactions} />);

    const balanceCard = screen.getByTestId('summary-balance');
    expect(balanceCard).toHaveTextContent('-R$ 1.500,00');
    expect(balanceCard).toHaveClass('text-rose-400');
  });

  it('displays neutral zero balance when transactions list is empty', () => {
    render(<MonthlySummary transactions={[]} />);

    expect(screen.getByTestId('summary-income')).toHaveTextContent('R$ 0,00');
    expect(screen.getByTestId('summary-expense')).toHaveTextContent('R$ 0,00');

    const balanceCard = screen.getByTestId('summary-balance');
    expect(balanceCard).toHaveTextContent('R$ 0,00');
    expect(balanceCard).toHaveClass('text-zinc-400');
    expect(balanceCard).not.toHaveClass('text-emerald-400');
    expect(balanceCard).not.toHaveClass('text-rose-400');
  });

  it('handles undefined transactions gracefully when isLoading is false', () => {
    render(<MonthlySummary transactions={undefined} isLoading={false} />);

    expect(screen.getByTestId('summary-income')).toHaveTextContent('R$ 0,00');
    expect(screen.getByTestId('summary-expense')).toHaveTextContent('R$ 0,00');

    const balanceCard = screen.getByTestId('summary-balance');
    expect(balanceCard).toHaveTextContent('R$ 0,00');
    expect(balanceCard).toHaveClass('text-zinc-400');
  });

  it('handles floating point precision anomalies cleanly (0.1 + 0.2)', () => {
    const floatTransactions = [
      createMockTransaction({ amount: 0.1, type: TransactionType.Income }),
      createMockTransaction({ amount: 0.2, type: TransactionType.Income }),
    ];

    render(<MonthlySummary transactions={floatTransactions} />);

    expect(screen.getByTestId('summary-income')).toHaveTextContent('R$ 0,30');
    expect(screen.getByTestId('summary-balance')).toHaveTextContent('R$ 0,30');
  });

  it('renders loading placeholder skeleton when isLoading is true', () => {
    render(<MonthlySummary transactions={undefined} isLoading={true} />);

    expect(screen.getByTestId('summary-skeleton')).toBeInTheDocument();
  });
});
