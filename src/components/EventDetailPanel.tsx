"use client";

import { useEffect } from "react";
import { Handshake, Link2, Megaphone, Sparkles, Users, X } from "lucide-react";
import type { CulturalEvent } from "@/lib/types";
import { getCategory } from "@/lib/categories";
import { formatDateRange, parseISO, relativeAnnounced } from "@/lib/dates";
import ImpactMeter from "./ImpactMeter";
import StatusBadge from "./StatusBadge";

interface EventDetailPanelProps {
  event: CulturalEvent | null;
  onClose: () => void;
}

/**
 * Slide-in side panel (modal overlay on small screens) that surfaces the
 * partnershipAngle and commercialDrivers immediately when an event is selected.
 */
export default function EventDetailPanel({ event, onClose }: EventDetailPanelProps) {
  useEffect(() => {
    if (!event) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [event, onClose]);

  const open = Boolean(event);
  const cat = event ? getCategory(event.category) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-ink/20 backdrop-blur-[1px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={event?.title ?? "Event details"}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-hairline bg-paper shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {event && cat && (
          <>
            {/* Accent rail */}
            <div className={`h-1 w-full ${cat.railClass}`} />

            <div className="flex items-start justify-between gap-4 px-7 pt-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] uppercase tracking-editorial ${cat.chipClass}`}
                  >
                    {cat.emoji} {cat.label}
                  </span>
                  <StatusBadge status={event.status} />
                </div>
                <p className="eyebrow">{event.subCategory}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-muted transition-colors hover:bg-hairline hover:text-ink"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-7 pb-8 pt-4">
              <h2 className="font-serif text-2xl leading-tight text-ink">
                {event.title}
              </h2>
              <p className="mt-2 text-sm text-muted">{formatDateRange(event)}</p>

              {event.announcedDate && (
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted">
                  <Megaphone size={13} />
                  Announced {relativeAnnounced(event.announcedDate)} ·{" "}
                  {parseISO(event.announcedDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}

              {event.description && (
                <p className="mt-4 text-[15px] leading-relaxed text-ink/90">
                  {event.description}
                </p>
              )}

              {/* Headliners / cast / lineup — the niche detail */}
              {event.headliners && event.headliners.length > 0 && (
                <section className="mt-6">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles size={15} className="text-ink" />
                    <h3 className="eyebrow text-ink">Headliners &amp; talent</h3>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {event.headliners.map((h, i) => (
                      <li
                        key={i}
                        className={`rounded-full px-3 py-1 text-xs ${cat.chipClass}`}
                      >
                        {h}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Impact */}
              <div className="mt-6 flex items-center justify-between border-y border-hairline py-4">
                <span className="eyebrow">Impact score</span>
                <div className="flex items-center gap-3">
                  <ImpactMeter score={event.impactScore} accent={cat.accent} />
                  <span className="text-lg font-medium tabular-nums">
                    {event.impactScore}
                    <span className="text-sm text-muted">/10</span>
                  </span>
                </div>
              </div>

              {/* Partnership angle — surfaced immediately */}
              <section className="mt-6">
                <div className="mb-2 flex items-center gap-2">
                  <Handshake size={15} className="text-ink" />
                  <h3 className="eyebrow text-ink">Partnership angle</h3>
                </div>
                <p className="text-[15px] leading-relaxed text-ink/90">
                  {event.partnershipAngle || "—"}
                </p>
              </section>

              {/* Commercial drivers */}
              <section className="mt-7">
                <div className="mb-3 flex items-center gap-2">
                  <Users size={15} className="text-ink" />
                  <h3 className="eyebrow text-ink">Commercial drivers</h3>
                </div>
                {event.commercialDrivers.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {event.commercialDrivers.map((d, i) => (
                      <li
                        key={i}
                        className="rounded-full border border-hairline px-3 py-1 text-xs text-ink/85"
                      >
                        {d}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">—</p>
                )}
              </section>

              {/* Sources */}
              {event.sourceUrls.length > 0 && (
                <section className="mt-7">
                  <div className="mb-3 flex items-center gap-2">
                    <Link2 size={15} className="text-ink" />
                    <h3 className="eyebrow text-ink">Sources</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {event.sourceUrls.map((url, i) => (
                      <li key={i}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="break-all text-sm text-ink underline decoration-hairline underline-offset-4 transition-colors hover:decoration-ink"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {event.source && (
                <p className="mt-8 text-[11px] uppercase tracking-editorial text-muted">
                  {event.source === "curated" ? "Curated entry" : "Pipeline-ingested"}
                </p>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
