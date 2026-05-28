"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CulturalEvent, CategoryId } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import { eventCoversDate, parseISO, toISO } from "@/lib/dates";
import CalendarMatrix from "./CalendarMatrix";
import AgendaView from "./AgendaView";
import EventDetailPanel from "./EventDetailPanel";
import FilterControls, { type ViewMode } from "./FilterControls";
import CategoryLegend from "./CategoryLegend";
import StatBar from "./StatBar";

interface DashboardProps {
  initialEvents: CulturalEvent[];
}

const ALL_CATEGORIES = new Set<CategoryId>(CATEGORIES.map((c) => c.id));

/** Pick the calendar month to open on: the earliest upcoming event, else now. */
function initialMonth(events: CulturalEvent[]): { year: number; month: number } {
  const now = new Date();
  const todayISO = toISO(now);
  const upcoming = events
    .map((e) => e.startDate)
    .filter((d) => d >= todayISO)
    .sort()[0];
  const ref = upcoming ? parseISO(upcoming) : now;
  return { year: ref.getFullYear(), month: ref.getMonth() };
}

export default function Dashboard({ initialEvents }: DashboardProps) {
  const [events, setEvents] = useState<CulturalEvent[]>(initialEvents);
  const [view, setView] = useState<ViewMode>("month");
  const [activeCategories, setActiveCategories] = useState<Set<CategoryId>>(
    new Set(ALL_CATEGORIES),
  );
  const [minImpact, setMinImpact] = useState(1);
  const [selected, setSelected] = useState<CulturalEvent | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const init = useMemo(() => initialMonth(initialEvents), [initialEvents]);
  const [year, setYear] = useState(init.year);
  const [month, setMonth] = useState(init.month);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/events", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      /* keep existing data on transient failure */
    }
  }, []);

  // Keep the selected event in sync with refreshed data; clear if removed.
  useEffect(() => {
    if (!selected) return;
    const fresh = events.find((e) => e.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [events, selected]);

  const filtered = useMemo(
    () =>
      events
        .filter((e) => activeCategories.has(e.category))
        .filter((e) => e.impactScore >= minImpact),
    [events, activeCategories, minImpact],
  );

  // In month view, the stat bar reflects the visible month; agenda reflects all.
  const visible = useMemo(() => {
    if (view === "agenda") return filtered;
    return filtered.filter((e) => {
      const d = parseISO(e.startDate);
      const sameMonth = d.getFullYear() === year && d.getMonth() === month;
      if (sameMonth) return true;
      // include multi-day events that span into this month
      const first = new Date(year, month, 1);
      const last = new Date(year, month + 1, 0);
      for (let day = new Date(first); day <= last; day.setDate(day.getDate() + 1)) {
        if (eventCoversDate(e, day)) return true;
      }
      return false;
    });
  }, [filtered, view, year, month]);

  const toggleCategory = useCallback((id: CategoryId) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // Never allow an empty selection — reset to all instead.
      return next.size === 0 ? new Set(ALL_CATEGORIES) : next;
    });
  }, []);

  const onSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/events/sync", { method: "POST" });
      const data = await res.json();
      await refetch();
      if (res.ok) {
        setToast(
          `Synced — ${data.added} new, ${data.updated} refreshed, ${data.skipped} curated kept`,
        );
      } else {
        setToast("Sync failed");
      }
    } catch {
      setToast("Sync failed — is the server running?");
    } finally {
      setSyncing(false);
      setTimeout(() => setToast(null), 4000);
    }
  }, [refetch]);

  const goPrev = () => {
    const d = new Date(year, month - 1, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };
  const goNext = () => {
    const d = new Date(year, month + 1, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };
  const goToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      {/* Masthead */}
      <header className="mb-8 border-b border-hairline pb-8">
        <p className="eyebrow">Cross-Industry Trend Intelligence</p>
        <h1 className="mt-2 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          Cultural Calendar
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          A color-coded intelligence layer tracking the intersections of art,
          fashion, entertainment, innovation, and pop culture — surfacing the
          strategic windows where high-end brands can collaborate.
        </p>
        <div className="mt-6">
          <CategoryLegend />
        </div>
      </header>

      <div className="mb-8">
        <StatBar events={view === "agenda" ? filtered : visible} />
      </div>

      <div className="mb-8">
        <FilterControls
          view={view}
          onViewChange={setView}
          activeCategories={activeCategories}
          onToggleCategory={toggleCategory}
          minImpact={minImpact}
          onMinImpactChange={setMinImpact}
          onSync={onSync}
          syncing={syncing}
          resultCount={view === "agenda" ? filtered.length : visible.length}
        />
      </div>

      {view === "month" ? (
        <CalendarMatrix
          year={year}
          month={month}
          events={filtered}
          onPrev={goPrev}
          onNext={goNext}
          onToday={goToday}
          onSelect={setSelected}
          selectedId={selected?.id}
        />
      ) : (
        <AgendaView
          events={filtered}
          onSelect={setSelected}
          selectedId={selected?.id}
        />
      )}

      <EventDetailPanel event={selected} onClose={() => setSelected(null)} />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-xs uppercase tracking-editorial text-paper shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
