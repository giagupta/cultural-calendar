import type { CategoryId } from "./types";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  emoji: string;
  blurb: string;
  /** Tailwind-friendly hex token, mirrors tailwind.config.ts. */
  accent: string;
  /** Tailwind class helpers for dots, chips, and rails. */
  dotClass: string;
  chipClass: string;
  railClass: string;
}

/**
 * The five core trend taxonomy pillars. Order here drives legend, filter,
 * and column ordering across the UI so the palette stays consistent.
 */
export const CATEGORIES: CategoryMeta[] = [
  {
    id: "art",
    label: "Art & Architecture",
    emoji: "🎨",
    blurb: "Gallery openings, major museum retrospectives, biennials.",
    accent: "#b48fd6",
    dotClass: "bg-art",
    chipClass: "bg-art/20 text-ink ring-1 ring-art/50",
    railClass: "bg-art",
  },
  {
    id: "fashion",
    label: "Fashion & Design",
    emoji: "👗",
    blurb: "Rising independent designers, couture weeks, capsule drops.",
    accent: "#ec8fb0",
    dotClass: "bg-fashion",
    chipClass: "bg-fashion/20 text-ink ring-1 ring-fashion/50",
    railClass: "bg-fashion",
  },
  {
    id: "entertainment",
    label: "Blockbuster Entertainment",
    emoji: "🎬",
    blurb: "Algorithmically significant film & streaming premieres.",
    accent: "#7eb3e6",
    dotClass: "bg-entertainment",
    chipClass: "bg-entertainment/20 text-ink ring-1 ring-entertainment/50",
    railClass: "bg-entertainment",
  },
  {
    id: "innovation",
    label: "Innovation & Partnerships",
    emoji: "🚀",
    blurb: "High-profile brand collabs, hardware drops, zeitgeist moments.",
    accent: "#82d2ad",
    dotClass: "bg-innovation",
    chipClass: "bg-innovation/20 text-ink ring-1 ring-innovation/50",
    railClass: "bg-innovation",
  },
  {
    id: "pop-culture",
    label: "Pop Culture & Live Events",
    emoji: "🎤",
    blurb: "Major music festivals, awards shows, viral cultural events.",
    accent: "#f0b95f",
    dotClass: "bg-pop-culture",
    chipClass: "bg-pop-culture/20 text-ink ring-1 ring-pop-culture/50",
    railClass: "bg-pop-culture",
  },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CategoryId, CategoryMeta>,
);

export function getCategory(id: CategoryId): CategoryMeta {
  return CATEGORY_MAP[id] ?? CATEGORIES[0];
}
