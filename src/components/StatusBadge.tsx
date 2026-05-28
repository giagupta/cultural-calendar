import type { EventStatus } from "@/lib/types";

const STYLES: Record<EventStatus, { label: string; className: string }> = {
  confirmed: {
    label: "Confirmed",
    className: "bg-innovation/25 text-ink ring-1 ring-innovation/50",
  },
  rumored: {
    label: "Rumored",
    className: "bg-pop-culture/25 text-ink ring-1 ring-pop-culture/50",
  },
  projected: {
    label: "Projected",
    className: "bg-entertainment/20 text-ink ring-1 ring-entertainment/50",
  },
};

/** Small confidence pill: Confirmed / Rumored / Projected. */
export default function StatusBadge({
  status,
  className = "",
}: {
  status?: EventStatus;
  className?: string;
}) {
  const meta = STYLES[status ?? "confirmed"];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${meta.className} ${className}`}
    >
      {meta.label}
    </span>
  );
}
