"use client";

import { useMemo } from "react";
import type { CulturalEvent } from "@/lib/types";
import { getCategory } from "@/lib/categories";
import {
  buildMonthGrid,
  eventCoversDate,
  toISO,
  WEEKDAY_LABELS,
} from "@/lib/dates";

interface CalendarMatrixProps {
  year: number;
  month: number;
  events: CulturalEvent[];
  onSelect: (event: CulturalEvent) => void;
  /** Jump to a specific day (e.g. clicking a date number opens Day view). */
  onPickDate?: (date: Date) => void;
  selectedId?: string;
}

/** Month grid body (Sun→Sat). The nav header lives in the Dashboard. */
export default function CalendarMatrix({
  year,
  month,
  events,
  onSelect,
  onPickDate,
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
    <div>
      {/* Weekday labels */}
      <div className="grid grid-cols-7 border-b border-hairline">
        {WEEKDAY_LABELS.map((w) => (
          <div
            key={w}
            className="px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-muted"
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
              className={`min-h-[156px] border-hairline p-2 ${
                lastCol ? "" : "border-r"
              } ${lastRow ? "" : "border-b"} ${
                cell.inMonth ? "bg-white" : "bg-paper/60"
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <button
                  onClick={() => onPickDate?.(cell.date)}
                  title="Open day"
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm tabular-nums transition-colors ${
                    isToday
                      ? "bg-ink font-medium text-paper"
                      : cell.inMonth
                        ? "text-ink hover:bg-hairline"
                        : "text-muted/50 hover:bg-hairline"
                  }`}
                >
                  {cell.date.getDate()}
                </button>
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
                      className={`flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-[13px] font-semibold leading-snug text-ink shadow-sm transition hover:brightness-95 ${
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
                    className="w-full rounded px-2 py-1 text-left text-xs font-semibold uppercase tracking-wide text-muted hover:bg-paper hover:text-ink"
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
