import type { CulturalEvent } from "./types";

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Parse a YYYY-MM-DD string into a local Date (no timezone drift). */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isSameDay(iso: string, date: Date): boolean {
  return iso.slice(0, 10) === toISO(date);
}

/** True if `date` falls within an event's [startDate, endDate] window. */
export function eventCoversDate(event: CulturalEvent, date: Date): boolean {
  const day = toISO(date);
  const start = event.startDate.slice(0, 10);
  const end = (event.endDate ?? event.startDate).slice(0, 10);
  return day >= start && day <= end;
}

export interface CalendarCell {
  date: Date;
  inMonth: boolean;
}

/**
 * Build a 6-row x 7-col grid (Sun-first) covering the given month, padded with
 * leading/trailing days from adjacent months.
 */
export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay()); // back up to the Sunday on/before the 1st

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    cells.push({ date, inMonth: date.getMonth() === month });
  }
  return cells;
}

/** Human-friendly "how long ago was this announced" label. */
export function relativeAnnounced(iso: string, now: Date = new Date()): string {
  const then = parseISO(iso);
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      then.getTime()) /
      86_400_000,
  );
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/** Compact lead-time label, e.g. "Lands Apr 2027" / "Lands in 3 weeks". */
export function leadTimeLabel(iso: string, now: Date = new Date()): string {
  const start = parseISO(iso);
  const days = Math.round(
    (start.getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86_400_000,
  );
  if (days < 0) return "Underway";
  if (days === 0) return "Today";
  if (days < 14) return `In ${days}d`;
  if (days < 60) return `In ${Math.floor(days / 7)}w`;
  return `${MONTH_NAMES[start.getMonth()].slice(0, 3)} ${start.getFullYear()}`;
}

export function formatDateRange(event: CulturalEvent): string {
  const start = parseISO(event.startDate);
  const startStr = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (!event.endDate || event.endDate.slice(0, 10) === event.startDate.slice(0, 10)) {
    return startStr;
  }
  const end = parseISO(event.endDate);
  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const endStr = end.toLocaleDateString("en-US", {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: "numeric",
  });
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${endStr}`;
}
