"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarHeaderProps {
  title: string;
  /** Optional secondary label shown under the title (e.g. event count). */
  subtitle?: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  prevLabel?: string;
  nextLabel?: string;
}

/** Shared title + prev/next/today nav bar for the dated calendar views. */
export default function CalendarHeader({
  title,
  subtitle,
  onPrev,
  onNext,
  onToday,
  prevLabel = "Previous",
  nextLabel = "Next",
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
      <div>
        <h2 className="font-serif text-2xl text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToday}
          className="mr-2 rounded-full border border-hairline px-3.5 py-1.5 text-xs uppercase tracking-editorial text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          Today
        </button>
        <button
          onClick={onPrev}
          aria-label={prevLabel}
          className="rounded-full p-2 text-muted transition-colors hover:bg-hairline hover:text-ink"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={onNext}
          aria-label={nextLabel}
          className="rounded-full p-2 text-muted transition-colors hover:bg-hairline hover:text-ink"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
