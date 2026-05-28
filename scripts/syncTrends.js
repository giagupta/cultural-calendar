#!/usr/bin/env node
/**
 * syncTrends.js — mock data ingestion pipeline.
 *
 * Simulates fetching fresh cultural/trend discoveries from an upstream feed
 * and merging them into the calendar's data layer WITHOUT overwriting curated
 * events.
 *
 * Two modes of operation:
 *   1. API mode (default): POST the batch to a running app's
 *      `/api/events/sync` endpoint. This is how a cron-scheduled worker would
 *      keep a live deployment fresh.
 *   2. Local mode (`--local`): merge the batch directly into
 *      `data/events.json`. Useful offline / in CI when no server is running.
 *
 * Scheduling:
 *   `--watch` keeps the process alive and re-runs on a cron cadence via
 *   node-cron (default: hourly). Override with `--schedule "<cron expr>"`.
 *
 * Usage:
 *   node scripts/syncTrends.js                 # one-shot, POST to localhost
 *   node scripts/syncTrends.js --local         # one-shot, write to JSON file
 *   node scripts/syncTrends.js --watch         # hourly via API
 *   node scripts/syncTrends.js --watch --local --schedule "*\/15 * * * *"
 *   node scripts/syncTrends.js --count 6 --url http://localhost:3000
 */

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(process.cwd(), "data", "events.json");

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = { watch: false, local: false, count: 4, schedule: "0 * * * *", url: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--watch") args.watch = true;
    else if (a === "--local") args.local = true;
    else if (a === "--count") args.count = parseInt(argv[++i], 10) || 4;
    else if (a === "--schedule") args.schedule = argv[++i];
    else if (a === "--url") args.url = argv[++i];
  }
  if (!args.url) {
    const base = process.env.SYNC_URL || process.env.APP_URL || "http://localhost:3000";
    args.url = base.replace(/\/$/, "");
  }
  return args;
}

// ---------------------------------------------------------------------------
// Mock upstream feed (self-contained mirror of src/lib/mockFeed.ts so the
// script runs as plain node without a build step).
// ---------------------------------------------------------------------------
const TEMPLATES = [
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

function hashId(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}
const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];
const isoDate = (d) => d.toISOString().slice(0, 10);

function generateTrendBatch(count, now) {
  now = now || new Date();
  const seedBase = Math.floor(now.getTime() / 60_000); // varies per minute
  const batch = [];
  for (let i = 0; i < count; i++) {
    const seed = seedBase + i * 97;
    const tpl = pick(TEMPLATES, seed);
    const title = pick(tpl.titles, seed + 1);
    const drivers = pick(tpl.drivers, seed + 2);
    const angle = pick(tpl.angles, seed + 3);

    const dayOffset = 7 + (Math.abs(seed * 13) % 84);
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

// ---------------------------------------------------------------------------
// Local merge (mirrors syncEvents in src/lib/db.ts)
// ---------------------------------------------------------------------------
function mergeLocal(incoming) {
  let existing = [];
  try {
    existing = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    if (!Array.isArray(existing)) existing = [];
  } catch {
    existing = [];
  }

  const byId = new Map(existing.map((e) => [e.id, e]));
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const ev of incoming) {
    const cur = byId.get(ev.id);
    if (cur) {
      if (cur.source === "curated") {
        skipped++;
        continue;
      }
      byId.set(ev.id, { ...cur, ...ev, source: "ingested" });
      updated++;
    } else {
      byId.set(ev.id, ev);
      added++;
    }
  }

  const next = Array.from(byId.values()).sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(next, null, 2) + "\n", "utf-8");
  return { added, updated, skipped, total: next.length };
}

// ---------------------------------------------------------------------------
// API merge
// ---------------------------------------------------------------------------
async function mergeViaApi(url, incoming) {
  const endpoint = `${url}/api/events/sync`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events: incoming }),
  });
  if (!res.ok) {
    throw new Error(`Sync endpoint returned ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
async function runOnce(args) {
  const stamp = new Date().toISOString();
  const batch = generateTrendBatch(args.count);
  console.log(`[syncTrends] ${stamp} — fetched ${batch.length} upstream discoveries`);

  try {
    let result;
    if (args.local) {
      result = mergeLocal(batch);
      console.log(`[syncTrends] merged locally → ${DATA_FILE}`);
    } else {
      try {
        result = await mergeViaApi(args.url, batch);
        console.log(`[syncTrends] posted to ${args.url}/api/events/sync`);
      } catch (apiErr) {
        console.warn(
          `[syncTrends] API unavailable (${apiErr.message}) — falling back to local merge`,
        );
        result = mergeLocal(batch);
      }
    }
    console.log(
      `[syncTrends] done — added ${result.added}, updated ${result.updated}, ` +
        `skipped ${result.skipped} (curated protected), total ${result.total}`,
    );
    return result;
  } catch (err) {
    console.error(`[syncTrends] sync failed: ${err.message}`);
    if (!args.watch) process.exitCode = 1;
  }
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.watch) {
    await runOnce(args);
    return;
  }

  // Scheduled mode.
  let cron;
  try {
    cron = require("node-cron");
  } catch {
    console.error(
      "[syncTrends] --watch requires node-cron. Run `npm install` first.",
    );
    process.exit(1);
  }

  if (!cron.validate(args.schedule)) {
    console.error(`[syncTrends] invalid cron expression: "${args.schedule}"`);
    process.exit(1);
  }

  console.log(
    `[syncTrends] watch mode — schedule "${args.schedule}" ` +
      `(${args.local ? "local file" : args.url})`,
  );
  await runOnce(args); // immediate first run
  cron.schedule(args.schedule, () => runOnce(args));
}

main();
