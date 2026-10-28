import { TZDate } from '@date-fns/tz';
import { addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthHeader } from '../../utils/formatters.ts';

export interface MonthSelectorProps {
  year: number;
  month: number; // 1 to 12 (human month)
  onMonthChange: (change: { year: number; month: number }) => void;
}

export function MonthSelector({ year, month, onMonthChange }: MonthSelectorProps) {
  const anchor = new TZDate(year, month - 1, 1, 'UTC');

  const handlePrevMonth = () => {
    const prev = subMonths(anchor, 1);
    onMonthChange({
      year: prev.getUTCFullYear(),
      month: prev.getUTCMonth() + 1,
    });
  };

  const handleNextMonth = () => {
    const next = addMonths(anchor, 1);
    onMonthChange({
      year: next.getUTCFullYear(),
      month: next.getUTCMonth() + 1,
    });
  };

  return (
    <nav
      aria-label="Navegação de mês"
      className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800/80 rounded-2xl px-3 py-2 text-zinc-100 shadow-sm backdrop-blur"
    >
      <button
        type="button"
        onClick={handlePrevMonth}
        aria-label="Mês anterior"
        className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-xl transition duration-150 cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
      </button>

      <span className="font-medium text-sm sm:text-base text-zinc-200 select-none">
        {formatMonthHeader(anchor)}
      </span>

      <button
        type="button"
        onClick={handleNextMonth}
        aria-label="Próximo mês"
        className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-xl transition duration-150 cursor-pointer"
      >
        <ChevronRight className="w-5 h-5" aria-hidden="true" />
      </button>
    </nav>
  );
}
