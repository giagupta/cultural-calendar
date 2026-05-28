import { CATEGORIES } from "@/lib/categories";

export default function CategoryLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {CATEGORIES.map((c) => (
        <div key={c.id} className="flex items-center gap-2" title={c.blurb}>
          <span className={`h-2.5 w-2.5 rounded-full ${c.dotClass}`} />
          <span className="text-xs text-ink/80">
            {c.emoji} {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}
