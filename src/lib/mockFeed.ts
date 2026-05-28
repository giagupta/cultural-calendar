import type { CategoryId, NewCulturalEvent } from "./types";

/**
 * Mock upstream feed simulator.
 *
 * Stands in for a real scraping/discovery pipeline that surfaces fresh
 * programmatic fashion/entertainment finds. Each generated event carries a
 * deterministic id derived from its title + date so repeated syncs refresh the
 * same record rather than creating duplicates (idempotent ingestion).
 */

interface FeedTemplate {
  category: CategoryId;
  subCategory: string;
  titles: string[];
  drivers: string[][];
  angles: string[];
  impact: [number, number];
  source: string;
}

const TEMPLATES: FeedTemplate[] = [
  {
    category: "fashion",
    subCategory: "Independent Designer",
    titles: [
      "Emerging Designer Showcase — 'MAISON VEER'",
      "Capsule Drop — 'STUDIO HÅLT'",
      "Trunk Show — 'CIEL ATELIER'",
      "Debut Collection — 'NOMA THREADS'",
    ],
    drivers: [
      ["Independent label", "Concept-store stockist"],
      ["Rising designer", "Dover Street Market"],
      ["Indie atelier", "Net-a-Porter (Vanguard)"],
    ],
    angles: [
      "Early-discovery window. A co-sign now buys subculture credibility before the label scales.",
      "High editorial pickup relative to spend — strong value for a discovery-positioned brand.",
    ],
    impact: [4, 7],
    source: "https://www.businessoffashion.com",
  },
  {
    category: "entertainment",
    subCategory: "Streaming Series",
    titles: [
      "New Prestige Drama — Series Premiere",
      "Limited Series Drop — Awards Contender",
      "Returning Franchise — Season Launch",
      "Breakout Comedy — Global Premiere",
    ],
    drivers: [
      ["Tier-1 streamer", "Award-pedigree showrunner"],
      ["Streaming platform", "Bankable lead cast"],
      ["Studio", "Costume-driven IP"],
    ],
    angles: [
      "Forecast multi-week retention. Shoppable wardrobe moments sustain demand across the rollout.",
      "Strong social-conversation index projected — suited to costume-led tie-ins.",
    ],
    impact: [5, 8],
    source: "https://www.nielsen.com",
  },
  {
    category: "innovation",
    subCategory: "Brand Collab",
    titles: [
      "Tech x Fashion Collaboration — Teaser",
      "Cross-Category Capsule — Reveal",
      "Designer x Hardware Collab — Drop",
      "Heritage Brand x Startup — Launch",
    ],
    drivers: [
      ["Consumer-tech firm", "Fashion house", "Creative agency"],
      ["Sportswear brand", "Streetwear designer"],
      ["Heritage maison", "Innovation studio"],
    ],
    angles: [
      "Co-branding template with shared craftsmanship language and limited-run scarcity.",
      "Hype-drop mechanics drive resale velocity and built-in secondary-market storytelling.",
    ],
    impact: [5, 8],
    source: "https://www.hypebeast.com",
  },
  {
    category: "pop-culture",
    subCategory: "Cultural Event",
    titles: [
      "Viral Pop-Up — Limited City Run",
      "Surprise Artist Activation",
      "Trending Live Event — Single Night",
      "Fan-Convention Headline Reveal",
    ],
    drivers: [
      ["Experiential agency", "Lifestyle brand"],
      ["Recording artist", "Streaming partner"],
    ],
    angles: [
      "Queue-culture mechanics manufacture scarcity — low-cost co-host slot for a luxury brand.",
      "Documented UGC engine; talent-seeding converts to organic reach fast.",
    ],
    impact: [4, 7],
    source: "https://www.adweek.com",
  },
];

/** Tiny deterministic string hash → stable id suffix. */
function hashId(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface BatchOptions {
  /** Number of synthetic events to emit (default 4). */
  count?: number;
  /** Reference "now"; events are scheduled in the following ~90 days. */
  now?: Date;
  /** Seed offset to vary output between runs. */
  seed?: number;
}

/**
 * Produce a batch of synthetic, programmatically-discovered events scheduled
 * across the upcoming ~90-day window.
 */
export function generateTrendBatch(options: BatchOptions = {}): NewCulturalEvent[] {
  const count = options.count ?? 4;
  const now = options.now ?? new Date();
  const seedBase = options.seed ?? Math.floor(now.getTime() / 86_400_000);

  const batch: NewCulturalEvent[] = [];
  for (let i = 0; i < count; i++) {
    const seed = seedBase + i * 97;
    const tpl = pick(TEMPLATES, seed);
    const title = pick(tpl.titles, seed + 1);
    const drivers = pick(tpl.drivers, seed + 2);
    const angle = pick(tpl.angles, seed + 3);

    const dayOffset = 7 + (Math.abs(seed * 13) % 84); // 1 week .. ~13 weeks out
    const start = new Date(now);
    start.setDate(start.getDate() + dayOffset);

    const span = tpl.category === "pop-culture" ? Math.abs(seed) % 3 : 0;
    const end = new Date(start);
    end.setDate(end.getDate() + span);

    const [lo, hi] = tpl.impact;
    const impact = lo + (Math.abs(seed * 7) % (hi - lo + 1));

    const startDate = isoDate(start);
    batch.push({
      id: `ingested-${hashId(title + startDate)}`,
      title,
      category: tpl.category,
      subCategory: tpl.subCategory,
      startDate,
      endDate: span > 0 ? isoDate(end) : undefined,
      impactScore: impact,
      commercialDrivers: drivers,
      partnershipAngle: angle,
      sourceUrls: [tpl.source],
      source: "ingested",
    });
  }
  return batch;
}
