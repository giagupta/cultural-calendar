import type { CulturalEvent } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";

interface StatBarProps {
  events: CulturalEvent[];
}

/** Compact summary strip: totals + per-pillar counts + peak collaboration window. */
export default function StatBar({ events }: StatBarProps) {
  const counts = CATEGORIES.map((c) => ({
    cat: c,
    count: events.filter((e) => e.category === c.id).length,
  }));

  const avgImpact =
    events.length > 0
      ? (
          events.reduce((s, e) => s + e.impactScore, 0) / events.length
        ).toFixed(1)
      : "0.0";

  const highImpact = events.filter((e) => e.impactScore >= 8).length;

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline sm:grid-cols-4">
      <Cell label="Tracked events" value={String(events.length)} />
      <Cell label="Avg impact" value={`${avgImpact}/10`} />
      <Cell label="High-impact (8+)" value={String(highImpact)} />
      <Cell
        label="Pillars active"
        value={String(counts.filter((c) => c.count > 0).length) + "/5"}
      />
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-5 py-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 font-serif text-2xl text-ink">{value}</p>
    </div>
  );
}
