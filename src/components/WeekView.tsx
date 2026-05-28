"use client";

import { useMemo } from "react";
import type { CulturalEvent } from "@/lib/types";
import { getCategory } from "@/lib/categories";
import { eventCoversDate, toISO, weekDays, WEEKDAY_LABELS } from "@/lib/dates";

interface WeekViewProps {
  date: Date;
  events: CulturalEvent[];
  onSelect: (event: CulturalEvent) => void;
  onPickDate?: (date: Date) => void;
  selectedId?: string;
}

/** Seven-day week view (Sun→Sat), each day a column of color blocks. */
export default function WeekView({
  date,
  events,
  onSelect,
  onPickDate,
  selectedId,
}: WeekViewProps) {
  const days = useMemo(() => weekDays(date), [date]);
  const todayISO = toISO(new Date());

  return (
    <div className="grid grid-cols-7">
      {days.map((day, i) => {
        const key = toISO(day);
        const isToday = key === todayISO;
        const dayEvents = events
          .filter((e) => eventCoversDate(e, day))
          .sort((a, b) => b.impactScore - a.impactScore);
        const lastCol = i === 6;
        return (
          <div
            key={key}
            className={`min-h-[420px] ${lastCol ? "" : "border-r"} border-hairline`}
          >
            <button
              onClick={() => onPickDate?.(day)}
              className={`flex w-full items-center justify-between border-b border-hairline px-3 py-2.5 text-left transition-colors hover:bg-paper ${
                isToday ? "bg-paper" : ""
              }`}
            >
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                {WEEKDAY_LABELS[i]}
              </span>
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm tabular-nums ${
                  isToday ? "bg-ink font-medium text-paper" : "text-ink"
                }`}
              >
                {day.getDate()}
              </span>
            </button>

            <div className="space-y-1 p-2">
              {dayEvents.map((e) => {
                const cat = getCategory(e.category);
                const selected = e.id === selectedId;
                return (
                  <button
                    key={e.id}
                    onClick={() => onSelect(e)}
                    title={`${cat.emoji} ${cat.label} · ${e.title} · impact ${e.impactScore}/10`}
                    style={{ backgroundColor: cat.accent }}
                    className={`block w-full rounded px-2 py-1.5 text-left text-[13px] font-semibold leading-snug text-ink shadow-sm transition hover:brightness-95 ${
                      selected ? "ring-2 ring-ink ring-offset-1 ring-offset-white" : ""
                    }`}
                  >
                    <span className="line-clamp-3">{e.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
