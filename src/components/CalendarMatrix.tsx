"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CulturalEvent } from "@/lib/types";
import { getCategory } from "@/lib/categories";
import {
  buildMonthGrid,
  eventCoversDate,
  MONTH_NAMES,
  toISO,
  WEEKDAY_LABELS,
} from "@/lib/dates";

interface CalendarMatrixProps {
  year: number;
  month: number;
  events: CulturalEvent[];
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onSelect: (event: CulturalEvent) => void;
  selectedId?: string;
}

export default function CalendarMatrix({
  year,
  month,
  events,
  onPrev,
  onNext,
  onToday,
  onSelect,
  selectedId,
}: CalendarMatrixProps) {
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const todayISO = toISO(new Date());

  // Group events by day for quick lookup.
  const byDay = useMemo(() => {
    const map = new Map<string, CulturalEvent[]>();
    for (const cell of cells) {
      const key = toISO(cell.date);
      const dayEvents = events
        .filter((e) => eventCoversDate(e, cell.date))
        .sort((a, b) => b.impactScore - a.impactScore);
      if (dayEvents.length) map.set(key, dayEvents);
    }
    return map;
  }, [cells, events]);

  return (
    <div className="rounded-lg border border-hairline bg-white">
      {/* Month header */}
      <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
        <h2 className="font-serif text-2xl text-ink">
          {MONTH_NAMES[month]}{" "}
          <span className="text-muted">{year}</span>
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onToday}
            className="mr-2 rounded-full border border-hairline px-3 py-1 text-xs uppercase tracking-editorial text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Today
          </button>
          <button
            onClick={onPrev}
            aria-label="Previous month"
            className="rounded-full p-2 text-muted transition-colors hover:bg-hairline hover:text-ink"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={onNext}
            aria-label="Next month"
            className="rounded-full p-2 text-muted transition-colors hover:bg-hairline hover:text-ink"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 border-b border-hairline">
        {WEEKDAY_LABELS.map((w) => (
          <div
            key={w}
            className="px-3 py-2 text-[11px] uppercase tracking-editorial text-muted"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const key = toISO(cell.date);
          const dayEvents = byDay.get(key) ?? [];
          const isToday = key === todayISO;
          const lastCol = (i + 1) % 7 === 0;
          const lastRow = i >= 35;
          return (
            <div
              key={key}
              className={`min-h-[132px] border-hairline p-2 ${
                lastCol ? "" : "border-r"
              } ${lastRow ? "" : "border-b"} ${
                cell.inMonth ? "bg-white" : "bg-paper/60"
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums ${
                    isToday
                      ? "bg-ink font-medium text-paper"
                      : cell.inMonth
                        ? "text-ink"
                        : "text-muted/50"
                  }`}
                >
                  {cell.date.getDate()}
                </span>
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((e) => {
                  const cat = getCategory(e.category);
                  const selected = e.id === selectedId;
                  return (
                    <button
                      key={e.id}
                      onClick={() => onSelect(e)}
                      title={`${cat.emoji} ${cat.label} · ${e.title} · impact ${e.impactScore}/10`}
                      style={{ backgroundColor: cat.accent }}
                      className={`flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[11px] font-medium leading-tight text-ink shadow-sm transition hover:brightness-95 ${
                        selected ? "ring-2 ring-ink ring-offset-1 ring-offset-white" : ""
                      }`}
                    >
                      <span className="truncate">{e.title}</span>
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <button
                    onClick={() => onSelect(dayEvents[3])}
                    className="w-full rounded px-1.5 py-0.5 text-left text-[10px] font-medium uppercase tracking-wide text-muted hover:bg-paper hover:text-ink"
                  >
                    +{dayEvents.length - 3} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
