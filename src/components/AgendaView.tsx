"use client";

import { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import type { CulturalEvent } from "@/lib/types";
import { getCategory } from "@/lib/categories";
import { formatDateRange, MONTH_NAMES, parseISO } from "@/lib/dates";
import ImpactMeter from "./ImpactMeter";
import StatusBadge from "./StatusBadge";

interface AgendaViewProps {
  events: CulturalEvent[];
  onSelect: (event: CulturalEvent) => void;
  selectedId?: string;
}

/** Chronological list/agenda view, grouped by month. */
export default function AgendaView({ events, onSelect, selectedId }: AgendaViewProps) {
  const groups = useMemo(() => {
    const sorted = [...events].sort((a, b) =>
      a.startDate.localeCompare(b.startDate),
    );
    const map = new Map<string, CulturalEvent[]>();
    for (const e of sorted) {
      const d = parseISO(e.startDate);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).map(([key, items]) => {
      const [y, m] = key.split("-").map(Number);
      return { label: `${MONTH_NAMES[m]} ${y}`, items };
    });
  }, [events]);

  if (!events.length) {
    return (
      <div className="rounded-lg border border-dashed border-hairline bg-white py-20 text-center">
        <p className="text-sm text-muted">
          No events match the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.label}>
          <h3 className="mb-3 font-serif text-lg text-muted">{group.label}</h3>
          <ul className="divide-y divide-hairline rounded-lg border border-hairline bg-white">
            {group.items.map((e) => {
              const cat = getCategory(e.category);
              const selected = e.id === selectedId;
              return (
                <li key={e.id}>
                  <button
                    onClick={() => onSelect(e)}
                    className={`group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors ${
                      selected ? "bg-paper" : "hover:bg-paper/70"
                    }`}
                  >
                    <span className={`h-10 w-1 shrink-0 rounded-full ${cat.railClass}`} />

                    <div className="w-28 shrink-0">
                      <p className="text-sm font-medium tabular-nums text-ink">
                        {formatDateRange(e)}
                      </p>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-[15px] text-ink">
                        <span className="truncate">{e.title}</span>
                        {e.status && e.status !== "confirmed" && (
                          <StatusBadge status={e.status} className="shrink-0" />
                        )}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {cat.emoji} {cat.label} · {e.subCategory}
                        {e.headliners && e.headliners.length > 0 && (
                          <span className="text-ink/70">
                            {" · "}
                            {e.headliners.slice(0, 3).join(", ")}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="hidden shrink-0 items-center gap-3 sm:flex">
                      <ImpactMeter score={e.impactScore} accent={cat.accent} />
                      <span className="w-8 text-right text-sm tabular-nums text-ink">
                        {e.impactScore}
                      </span>
                    </div>

                    <ArrowUpRight
                      size={16}
                      className="shrink-0 text-muted/0 transition-colors group-hover:text-muted"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
