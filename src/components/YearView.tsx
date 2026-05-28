"use client";

import { useMemo } from "react";
import type { CategoryId, CulturalEvent } from "@/lib/types";
import { CATEGORY_MAP } from "@/lib/categories";
import { buildMonthGrid, eventCoversDate, MONTH_NAMES, toISO } from "@/lib/dates";

interface YearViewProps {
  year: number;
  events: CulturalEvent[];
  /** Click a day → open Day view for that date. */
  onPickDate: (date: Date) => void;
  /** Click a month name → open Month view for that month. */
  onPickMonth: (date: Date) => void;
}

const MINI_WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** Year overview: twelve mini-months with category-colored dots on event days. */
export default function YearView({ year, events, onPickDate, onPickMonth }: YearViewProps) {
  const todayISO = toISO(new Date());

  // Map each ISO day → ordered, de-duped category ids present that day.
  const byDay = useMemo(() => {
    const map = new Map<string, CategoryId[]>();
    const order: CategoryId[] = [
      "art",
      "fashion",
      "entertainment",
      "innovation",
      "pop-culture",
    ];
    for (let m = 0; m < 12; m++) {
      for (const cell of buildMonthGrid(year, m)) {
        if (cell.date.getMonth() !== m) continue;
        const cats = new Set<CategoryId>();
        for (const e of events) if (eventCoversDate(e, cell.date)) cats.add(e.category);
        if (cats.size) {
          map.set(
            toISO(cell.date),
            order.filter((c) => cats.has(c)),
          );
        }
      }
    }
    return map;
  }, [events, year]);

  return (
    <div className="grid grid-cols-1 gap-px bg-hairline sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 12 }, (_, month) => {
        const cells = buildMonthGrid(year, month);
        return (
          <div key={month} className="bg-white p-4">
            <button
              onClick={() => onPickMonth(new Date(year, month, 1))}
              className="mb-2 font-serif text-lg text-ink underline-offset-4 hover:underline"
            >
              {MONTH_NAMES[month]}
            </button>
            <div className="grid grid-cols-7 gap-y-1">
              {MINI_WEEKDAYS.map((w, i) => (
                <div key={i} className="text-center text-[10px] text-muted">
                  {w}
                </div>
              ))}
              {cells.map((cell) => {
                const key = toISO(cell.date);
                const cats = byDay.get(key);
                const isToday = key === todayISO;
                const inMonth = cell.date.getMonth() === month;
                return (
                  <button
                    key={key}
                    onClick={() => onPickDate(cell.date)}
                    disabled={!inMonth}
                    title={cats ? `${cats.length} category(ies) · open day` : "open day"}
                    className={`flex flex-col items-center rounded py-0.5 text-[11px] tabular-nums transition-colors ${
                      !inMonth
                        ? "invisible"
                        : isToday
                          ? "bg-ink font-medium text-paper"
                          : "text-ink hover:bg-hairline"
                    }`}
                  >
                    <span>{cell.date.getDate()}</span>
                    <span className="mt-0.5 flex h-1.5 items-center gap-0.5">
                      {cats?.slice(0, 4).map((c) => (
                        <span
                          key={c}
                          className="h-1 w-1 rounded-full"
                          style={{ backgroundColor: CATEGORY_MAP[c].accent }}
                        />
                      ))}
                    </span>
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
