"use client";

import {
  CalendarClock,
  CalendarDays,
  CalendarRange,
  LayoutGrid,
  List,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";

export type ViewMode = "day" | "week" | "month" | "year" | "schedule";

const VIEWS: { id: ViewMode; label: string; icon: LucideIcon }[] = [
  { id: "day", label: "Day", icon: CalendarClock },
  { id: "week", label: "Week", icon: CalendarRange },
  { id: "month", label: "Month", icon: CalendarDays },
  { id: "year", label: "Year", icon: LayoutGrid },
  { id: "schedule", label: "Schedule", icon: List },
];

interface FilterControlsProps {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  activeCategories: Set<CategoryId>;
  onToggleCategory: (id: CategoryId) => void;
  minImpact: number;
  onMinImpactChange: (n: number) => void;
  onSync: () => void;
  syncing: boolean;
  resultCount: number;
}

export default function FilterControls({
  view,
  onViewChange,
  activeCategories,
  onToggleCategory,
  minImpact,
  onMinImpactChange,
  onSync,
  syncing,
  resultCount,
}: FilterControlsProps) {
  return (
    <div className="space-y-5">
      {/* View switcher + sync */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap overflow-hidden rounded-full border border-hairline">
          {VIEWS.map((v) => {
            const Icon = v.icon;
            const active = view === v.id;
            return (
              <button
                key={v.id}
                onClick={() => onViewChange(v.id)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs uppercase tracking-editorial transition-colors ${
                  active ? "bg-ink text-paper" : "text-muted hover:text-ink"
                }`}
              >
                <Icon size={14} /> {v.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">{resultCount} events</span>
          <button
            onClick={onSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-4 py-1.5 text-xs uppercase tracking-editorial text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
            title="Trigger the mock ingestion pipeline (/api/events/sync)"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing" : "Sync trends"}
          </button>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => {
          const active = activeCategories.has(c.id);
          return (
            <button
              key={c.id}
              onClick={() => onToggleCategory(c.id)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition-all ${
                active
                  ? c.chipClass
                  : "text-muted ring-1 ring-hairline hover:text-ink"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${c.dotClass}`} />
              {c.emoji} {c.label}
            </button>
          );
        })}
      </div>

      {/* Impact threshold */}
      <div className="flex items-center gap-3">
        <SlidersHorizontal size={14} className="text-muted" />
        <label htmlFor="impact" className="eyebrow whitespace-nowrap">
          Min impact
        </label>
        <input
          id="impact"
          type="range"
          min={1}
          max={10}
          step={1}
          value={minImpact}
          onChange={(e) => onMinImpactChange(Number(e.target.value))}
          className="h-1 w-48 cursor-pointer appearance-none rounded-full bg-hairline accent-ink"
        />
        <span className="w-6 text-base font-medium tabular-nums">{minImpact}</span>
        <span className="text-sm text-muted">/ 10</span>
      </div>
    </div>
  );
}
