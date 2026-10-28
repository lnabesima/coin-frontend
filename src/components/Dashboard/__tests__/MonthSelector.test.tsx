import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MonthSelector } from '../MonthSelector.tsx';

describe('MonthSelector Component', () => {
  const onMonthChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders capitalized localized month and year header in PT-BR', () => {
    render(<MonthSelector year={2026} month={10} onMonthChange={onMonthChange} />);

    expect(screen.getByText('Outubro de 2026')).toBeInTheDocument();
  });

  it('renders accessible previous and next month buttons', () => {
    render(<MonthSelector year={2026} month={10} onMonthChange={onMonthChange} />);

    expect(screen.getByRole('button', { name: /mês anterior/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /próximo mês/i })).toBeInTheDocument();
  });

  it('calls onMonthChange with September (month: 9) when clicking previous month from October (month: 10)', async () => {
    const user = userEvent.setup();
    render(<MonthSelector year={2026} month={10} onMonthChange={onMonthChange} />);

    const prevButton = screen.getByRole('button', { name: /mês anterior/i });
    await user.click(prevButton);

    expect(onMonthChange).toHaveBeenCalledTimes(1);
    expect(onMonthChange).toHaveBeenCalledWith({ year: 2026, month: 9 });
  });

  it('calls onMonthChange with November (month: 11) when clicking next month from October (month: 10)', async () => {
    const user = userEvent.setup();
    render(<MonthSelector year={2026} month={10} onMonthChange={onMonthChange} />);

    const nextButton = screen.getByRole('button', { name: /próximo mês/i });
    await user.click(nextButton);

    expect(onMonthChange).toHaveBeenCalledTimes(1);
    expect(onMonthChange).toHaveBeenCalledWith({ year: 2026, month: 11 });
  });

  it('handles year boundary rollover backwards from January to December of previous year', async () => {
    const user = userEvent.setup();
    render(<MonthSelector year={2026} month={1} onMonthChange={onMonthChange} />);

    const prevButton = screen.getByRole('button', { name: /mês anterior/i });
    await user.click(prevButton);

    expect(onMonthChange).toHaveBeenCalledTimes(1);
    expect(onMonthChange).toHaveBeenCalledWith({ year: 2025, month: 12 });
  });

  it('handles year boundary rollover forwards from December to January of next year', async () => {
    const user = userEvent.setup();
    render(<MonthSelector year={2026} month={12} onMonthChange={onMonthChange} />);

    const nextButton = screen.getByRole('button', { name: /próximo mês/i });
    await user.click(nextButton);

    expect(onMonthChange).toHaveBeenCalledTimes(1);
    expect(onMonthChange).toHaveBeenCalledWith({ year: 2027, month: 1 });
  });
});
