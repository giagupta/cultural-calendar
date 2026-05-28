"use client";

import { useMemo } from "react";
import type { CulturalEvent } from "@/lib/types";
import { getCategory } from "@/lib/categories";
import { eventCoversDate } from "@/lib/dates";
import ImpactMeter from "./ImpactMeter";
import StatusBadge from "./StatusBadge";

interface DayViewProps {
  date: Date;
  events: CulturalEvent[];
  onSelect: (event: CulturalEvent) => void;
  selectedId?: string;
}

/** Single-day view: the day's events as full-width cards, by impact. */
export default function DayView({ date, events, onSelect, selectedId }: DayViewProps) {
  const dayEvents = useMemo(
    () =>
      events
        .filter((e) => eventCoversDate(e, date))
        .sort((a, b) => b.impactScore - a.impactScore),
    [events, date],
  );

  if (!dayEvents.length) {
    return (
      <div className="px-5 py-20 text-center">
        <p className="text-base text-muted">No events on this day.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-hairline">
      {dayEvents.map((e) => {
        const cat = getCategory(e.category);
        const selected = e.id === selectedId;
        return (
          <li key={e.id}>
            <button
              onClick={() => onSelect(e)}
              className={`flex w-full items-start gap-4 px-5 py-5 text-left transition-colors ${
                selected ? "bg-paper" : "hover:bg-paper/70"
              }`}
            >
              <span className={`mt-1 h-14 w-1.5 shrink-0 rounded-full ${cat.railClass}`} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs ${cat.chipClass}`}
                  >
                    {cat.emoji} {cat.label}
                  </span>
                  <StatusBadge status={e.status} />
                </div>
                <p className="text-lg font-medium text-ink">{e.title}</p>
                <p className="mt-0.5 text-sm text-muted">{e.subCategory}</p>
                {e.headliners && e.headliners.length > 0 && (
                  <p className="mt-1 text-sm text-ink/70">
                    {e.headliners.slice(0, 4).join(", ")}
                  </p>
                )}
              </div>
              <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
                <ImpactMeter score={e.impactScore} accent={cat.accent} />
                <span className="text-sm tabular-nums text-muted">
                  Impact {e.impactScore}/10
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
