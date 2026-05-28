# Cultural & Trend Intelligence Calendar

A modular, full-stack, color-coded calendar that tracks, visualizes, and
surfaces **cross-industry cultural intersections** — across Art, Fashion,
Entertainment, Innovation, and Pop Culture — to identify strategic
collaboration windows for high-end consumer brands.

> Minimalist, high-end editorial aesthetic. Stark paper/ink palette, sharp
> typography, subtle grid borders, and low-saturation pastel category accents.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | **Next.js 14** (App Router), **React 18**, **Tailwind CSS** |
| Icons | **lucide-react** |
| Backend | Next.js **API routes** (Node runtime) |
| Data | **JSON-file** data layer (`data/events.json`) |
| Automation | **node-cron** ingestion worker (`scripts/syncTrends.js`) |

---

## The five trend taxonomy pillars

| | Pillar | Examples |
| --- | --- | --- |
| 🎨 | **Art & Architecture** | Gallery openings, museum retrospectives, biennials |
| 👗 | **Fashion & Design** | Rising designers, couture weeks, capsule drops |
| 🎬 | **Blockbuster Entertainment** | Significant film & streaming premieres |
| 🚀 | **Innovation & Partnerships** | Brand collabs, hardware drops, zeitgeist moments |
| 🎤 | **Pop Culture & Live Events** | Music festivals, awards shows, viral events |

Each category has a distinct, low-saturation accent (defined once in
`tailwind.config.ts` and `src/lib/categories.ts`) used consistently across
dots, chips, rails, and the impact meter.

---

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

The data layer is file-backed and seeded with ~20 curated events spanning the
next three months, so the dashboard renders immediately with no extra setup.

### Production

```bash
npm run build
npm run start
```

---

## Data model

Every event — curated or pipeline-ingested — conforms to `CulturalEvent`
(`src/lib/types.ts`):

```ts
interface CulturalEvent {
  id: string;
  title: string;
  category: 'art' | 'fashion' | 'entertainment' | 'innovation' | 'pop-culture';
  subCategory: string;        // "Independent Designer", "Streaming Series", ...
  startDate: string;          // ISO YYYY-MM-DD
  endDate?: string;           // optional multi-day window
  impactScore: number;        // 1–10 strategic weight
  commercialDrivers: string[];// actors, designers, parent corps, agencies
  partnershipAngle: string;   // why it matters for co-branding
  sourceUrls: string[];
  source?: 'curated' | 'ingested';      // provenance (curated is never overwritten)
  announcedDate?: string;               // ISO date the news broke → powers the announcements feed
  headliners?: string[];                // named lineup / cast / creators (the niche detail)
  description?: string;                  // short editorial context note
  status?: 'confirmed' | 'rumored' | 'projected'; // confidence in the specifics
}
```

The seed dataset spans **June 2026 → June 2027** (~55 events) with specific
headliners and cast (e.g. Nolan's *The Odyssey*, *Dune: Part Three*, Met Gala
2027, Coachella 2027), each tagged with a confidence level so speculative
far-out lineups read honestly rather than as fact.

---

## API

Base path: `/api/events`

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/events` | List events. Filters: `?category=art,fashion&minImpact=7&from=2026-06-01&to=2026-08-31` |
| `POST` | `/api/events` | Create a curated event |
| `GET` | `/api/events/:id` | Fetch one event |
| `PUT` | `/api/events/:id` | Partial update |
| `DELETE` | `/api/events/:id` | Remove an event |
| `POST` | `/api/events/sync` | **Ingestion trigger.** Merges an upstream batch |

### `/api/events/sync`

The ingestion endpoint cron workers call. It either accepts an explicit batch
(`{ "events": [ ... ] }`) or — when called with no body — synthesizes a fresh
mock batch from the upstream feed simulator (`src/lib/mockFeed.ts`).

**Curated events are never overwritten.** Merge rules (`syncEvents` in
`src/lib/db.ts`):

- `source: "curated"` events with a matching id → **skipped** (protected).
- previously `ingested` events with a matching id → **refreshed** in place.
- everything else → **appended**.

Response:

```json
{ "ok": true, "syncedAt": "...", "added": 2, "updated": 1, "skipped": 0, "total": 23 }
```

---

## Data ingestion pipeline

`scripts/syncTrends.js` simulates fetching fresh fashion/entertainment
discoveries from an upstream feed and merging them via the data layer.

```bash
npm run sync                       # one-shot: POST to a running app's /api/events/sync
node scripts/syncTrends.js --local # one-shot: merge directly into data/events.json
npm run sync:cron                  # scheduled (hourly) via node-cron
node scripts/syncTrends.js --watch --schedule "*/15 * * * *"   # every 15 min
node scripts/syncTrends.js --count 6 --url http://localhost:3000
```

Flags: `--watch` (cron), `--local` (write to file), `--count <n>`,
`--schedule "<cron>"`, `--url <base>`. Env: `SYNC_URL` / `APP_URL`.

Generated events use deterministic ids (title + date hash), so repeated syncs
**refresh** the same record rather than duplicating it.

---

## Project structure

```
data/events.json              # file-backed store (seed dataset)
scripts/syncTrends.js         # mock ingestion pipeline / cron worker
src/
  app/
    layout.tsx  globals.css   # root layout + editorial base styles
    page.tsx                  # server component → loads events → <Dashboard/>
    api/events/
      route.ts                # GET (list+filter), POST (create)
      [id]/route.ts           # GET / PUT / DELETE
      sync/route.ts           # POST ingestion trigger
  components/
    Dashboard.tsx             # client orchestrator (state, fetch, sync)
    CalendarMatrix.tsx        # month grid view
    AgendaView.tsx            # list / agenda view (with headliners + status)
    AnnouncementsRail.tsx     # cross-time "Recent Announcements" feed
    EventDetailPanel.tsx      # slide-in panel (angle, drivers, headliners, desc)
    FilterControls.tsx        # view toggle, category + impact filters, sync
    CategoryLegend.tsx  StatBar.tsx  ImpactMeter.tsx  StatusBadge.tsx
  lib/
    types.ts                  # CulturalEvent contract
    categories.ts             # taxonomy + color tokens
    db.ts                     # JSON file data layer (CRUD + curated-safe sync)
    mockFeed.ts               # upstream feed simulator
    dates.ts                  # calendar grid / date helpers
```

---

## Features

- **Month matrix** and **list/agenda** views, toggled in place, spanning a
  full year of cultural dates.
- **Recent Announcements** rail — a cross-time feed sorted by `announcedDate`,
  so far-future events (next year's festivals, casting news) surface the moment
  they break. Each card shows confidence (Confirmed / Rumored / Projected),
  how long ago it was announced, and the lead time until it lands. Respects the
  category toggles but is independent of the impact slider and month navigation.
- **Strict color-coding** across the five pillars, consistent everywhere.
- **Filtering** by any combination of categories and a 1–10 impact threshold.
- **Detail side panel** that surfaces `partnershipAngle`, `commercialDrivers`,
  the `description`, and named **headliners/talent** immediately on selection,
  plus a confidence badge and when the news was announced.
- **Sync trends** button wired to the live ingestion endpoint, with a summary
  toast and curated-event protection. Ingested discoveries arrive stamped with
  today's `announcedDate`, so they appear in the announcements rail.
- **Summary stat bar**: tracked events, average/high impact, active pillars.
