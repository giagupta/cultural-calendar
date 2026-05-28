"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Megaphone } from "lucide-react";
import type { CulturalEvent } from "@/lib/types";
import { getCategory } from "@/lib/categories";
import { leadTimeLabel, relativeAnnounced } from "@/lib/dates";
import StatusBadge from "./StatusBadge";

interface AnnouncementsRailProps {
  events: CulturalEvent[];
  onSelect: (event: CulturalEvent) => void;
  selectedId?: string;
  /** Max cards to surface. */
  limit?: number;
}

/**
 * "Recent Announcements" feed — a cross-time view of what just broke, sorted by
 * the date the news was announced (newest first). Lets far-future events
 * (next year's festivals, casting news) surface the moment they're announced.
 */
export default function AnnouncementsRail({
  events,
  onSelect,
  selectedId,
  limit = 12,
}: AnnouncementsRailProps) {
  const [open, setOpen] = useState(true);

  const announcements = useMemo(
    () =>
      events
        .filter((e) => Boolean(e.announcedDate))
        .sort((a, b) => (b.announcedDate ?? "").localeCompare(a.announcedDate ?? ""))
        .slice(0, limit),
    [events, limit],
  );

  if (!announcements.length) return null;

  return (
    <section className="rounded-lg border border-hairline bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Megaphone size={16} className="text-ink" />
          <span className="eyebrow text-ink">Recent Announcements</span>
          <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-medium text-paper">
            {announcements.length}
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="flex gap-3 overflow-x-auto border-t border-hairline px-5 py-4">
          {announcements.map((e) => {
            const cat = getCategory(e.category);
            const selected = e.id === selectedId;
            return (
              <button
                key={e.id}
                onClick={() => onSelect(e)}
                className={`group flex w-64 shrink-0 flex-col rounded-md border p-3 text-left transition-colors ${
                  selected
                    ? "border-ink bg-paper"
                    : "border-hairline hover:border-ink/40 hover:bg-paper/60"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted">
                    <span className={`h-2.5 w-2.5 rounded-full ${cat.dotClass}`} />
                    {cat.emoji} {cat.label}
                  </span>
                  <StatusBadge status={e.status} />
                </div>

                <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink">
                  {e.title}
                </p>

                {e.headliners && e.headliners.length > 0 && (
                  <p className="mt-1.5 line-clamp-1 text-[13px] text-muted">
                    {e.headliners.slice(0, 3).join(", ")}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between pt-3 text-[11px] uppercase tracking-wide">
                  <span className="text-muted">
                    📣 {relativeAnnounced(e.announcedDate!)}
                  </span>
                  <span className="rounded-full bg-paper px-2 py-0.5 text-ink ring-1 ring-hairline">
                    {leadTimeLabel(e.startDate)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
