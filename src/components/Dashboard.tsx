"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CulturalEvent, CategoryId } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import {
  addDays,
  addMonths,
  addYears,
  MONTH_NAMES,
  parseISO,
  startOfWeek,
  toISO,
} from "@/lib/dates";
import CalendarMatrix from "./CalendarMatrix";
import CalendarHeader from "./CalendarHeader";
import DayView from "./DayView";
import WeekView from "./WeekView";
import YearView from "./YearView";
import AgendaView from "./AgendaView";
import EventDetailPanel from "./EventDetailPanel";
import FilterControls, { type ViewMode } from "./FilterControls";
import CategoryLegend from "./CategoryLegend";
import StatBar from "./StatBar";
import AnnouncementsRail from "./AnnouncementsRail";

interface DashboardProps {
  initialEvents: CulturalEvent[];
}

const ALL_CATEGORIES = new Set<CategoryId>(CATEGORIES.map((c) => c.id));

/** Open on the earliest upcoming event's date, else today. */
function initialFocus(events: CulturalEvent[]): Date {
  const now = new Date();
  const todayISO = toISO(now);
  const upcoming = events
    .map((e) => e.startDate)
    .filter((d) => d >= todayISO)
    .sort()[0];
  return upcoming ? parseISO(upcoming) : now;
}

/** Inclusive [from, to] ISO window covered by a view; null = all time. */
function viewRange(view: ViewMode, focus: Date): { from: string; to: string } | null {
  switch (view) {
    case "day":
      return { from: toISO(focus), to: toISO(focus) };
    case "week": {
      const start = startOfWeek(focus);
      return { from: toISO(start), to: toISO(addDays(start, 6)) };
    }
    case "month": {
      const first = new Date(focus.getFullYear(), focus.getMonth(), 1);
      const last = new Date(focus.getFullYear(), focus.getMonth() + 1, 0);
      return { from: toISO(first), to: toISO(last) };
    }
    case "year":
      return { from: `${focus.getFullYear()}-01-01`, to: `${focus.getFullYear()}-12-31` };
    default:
      return null; // schedule = all time
  }
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

  const [focus, setFocus] = useState<Date>(() => initialFocus(initialEvents));

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

  // Category-only set powers the cross-time announcements feed (ignores the
  // impact slider and month navigation by design).
  const categoryFiltered = useMemo(
    () => events.filter((e) => activeCategories.has(e.category)),
    [events, activeCategories],
  );

  const filtered = useMemo(
    () => categoryFiltered.filter((e) => e.impactScore >= minImpact),
    [categoryFiltered, minImpact],
  );

  // The stat bar / count reflect the events within the active view's window
  // (schedule shows everything). An event counts if its span overlaps the range.
  const visible = useMemo(() => {
    const range = viewRange(view, focus);
    if (!range) return filtered;
    return filtered.filter(
      (e) =>
        e.startDate.slice(0, 10) <= range.to &&
        (e.endDate ?? e.startDate).slice(0, 10) >= range.from,
    );
  }, [filtered, view, focus]);

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
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await refetch();
        setToast(
          `Synced — ${data.added} new, ${data.updated} refreshed, ${data.skipped} curated kept`,
        );
      } else {
        setToast(data?.error ? `Sync failed: ${data.error}` : "Sync failed");
      }
    } catch (err) {
      setToast(
        `Sync failed — ${err instanceof Error ? err.message : "network error"}`,
      );
    } finally {
      setSyncing(false);
      setTimeout(() => setToast(null), 5000);
    }
  }, [refetch]);

  const shift = (dir: 1 | -1) => {
    setFocus((d) => {
      if (view === "day") return addDays(d, dir);
      if (view === "week") return addDays(d, dir * 7);
      if (view === "year") return addYears(d, dir);
      return addMonths(d, dir); // month (and any dated default)
    });
  };
  const goPrev = () => shift(-1);
  const goNext = () => shift(1);
  const goToday = () => setFocus(new Date());

  // Title for the shared nav header, per view.
  const headerTitle = useMemo(() => {
    switch (view) {
      case "day":
        return focus.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      case "week": {
        const s = startOfWeek(focus);
        const e = addDays(s, 6);
        const sameMonth = s.getMonth() === e.getMonth();
        const left = s.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const right = (sameMonth ? e.getDate() : `${MONTH_NAMES[e.getMonth()].slice(0, 3)} ${e.getDate()}`);
        return `${left} – ${right}, ${e.getFullYear()}`;
      }
      case "year":
        return String(focus.getFullYear());
      default:
        return `${MONTH_NAMES[focus.getMonth()]} ${focus.getFullYear()}`;
    }
  }, [view, focus]);

  const openDay = (date: Date) => {
    setFocus(date);
    setView("day");
  };
  const openMonth = (date: Date) => {
    setFocus(date);
    setView("month");
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      {/* Masthead */}
      <header className="mb-8 border-b border-hairline pb-8">
        <p className="eyebrow">Cross-Industry Trend Intelligence</p>
        <h1 className="mt-2 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          Cultural Calendar
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          A color-coded intelligence layer tracking the intersections of art,
          fashion, entertainment, innovation, and pop culture — surfacing the
          strategic windows where high-end brands can collaborate.
        </p>
        <div className="mt-6">
          <CategoryLegend />
        </div>
      </header>

      <div className="mb-8">
        <AnnouncementsRail
          events={categoryFiltered}
          onSelect={setSelected}
          selectedId={selected?.id}
        />
      </div>

      <div className="mb-8">
        <StatBar events={view === "schedule" ? filtered : visible} />
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
          resultCount={view === "schedule" ? filtered.length : visible.length}
        />
      </div>

      {view === "schedule" ? (
        <AgendaView
          events={filtered}
          onSelect={setSelected}
          selectedId={selected?.id}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-hairline bg-white">
          <CalendarHeader
            title={headerTitle}
            subtitle={`${visible.length} event${visible.length === 1 ? "" : "s"} in view`}
            onPrev={goPrev}
            onNext={goNext}
            onToday={goToday}
          />
          {view === "day" && (
            <DayView
              date={focus}
              events={filtered}
              onSelect={setSelected}
              selectedId={selected?.id}
            />
          )}
          {view === "week" && (
            <WeekView
              date={focus}
              events={filtered}
              onSelect={setSelected}
              onPickDate={openDay}
              selectedId={selected?.id}
            />
          )}
          {view === "month" && (
            <CalendarMatrix
              year={focus.getFullYear()}
              month={focus.getMonth()}
              events={filtered}
              onSelect={setSelected}
              onPickDate={openDay}
              selectedId={selected?.id}
            />
          )}
          {view === "year" && (
            <YearView
              year={focus.getFullYear()}
              events={filtered}
              onPickDate={openDay}
              onPickMonth={openMonth}
            />
          )}
        </div>
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
