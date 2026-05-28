import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { CulturalEvent, NewCulturalEvent, CategoryId } from "./types";

/**
 * JSON-file-based persistence layer.
 *
 * The store lives at `data/events.json` and is the single source of truth for
 * both the Next.js API routes and the offline ingestion script. Writes are
 * serialized through an in-process queue so concurrent API requests cannot
 * interleave and corrupt the file.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "events.json");

let writeChain: Promise<unknown> = Promise.resolve();

/**
 * In-memory fallback store. On read-only filesystems (many serverless / preview
 * hosts), `fs.writeFile` throws — so once a write fails we keep mutations in
 * memory for the lifetime of the process. Reads then come from memory too, so
 * sync and CRUD still work for the session even when the disk isn't writable.
 */
let memoryStore: CulturalEvent[] | null = null;
let warnedReadOnly = false;

function isValidCategory(value: unknown): value is CategoryId {
  return (
    value === "art" ||
    value === "fashion" ||
    value === "entertainment" ||
    value === "innovation" ||
    value === "pop-culture"
  );
}

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, "[]\n", "utf-8");
  }
}

export async function readAll(): Promise<CulturalEvent[]> {
  // Once we've fallen back to memory (read-only disk), serve from it.
  if (memoryStore !== null) return memoryStore.map((e) => ({ ...e }));
  try {
    await ensureFile();
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CulturalEvent[]) : [];
  } catch {
    return [];
  }
}

/** Persist the full collection, sorted by start date for stable diffs. */
async function persist(events: CulturalEvent[]): Promise<void> {
  const sorted = [...events].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
  // Already in memory-only mode → just update the in-memory copy.
  if (memoryStore !== null) {
    memoryStore = sorted;
    return;
  }
  try {
    await ensureFile();
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(sorted, null, 2) + "\n",
      "utf-8",
    );
  } catch (err) {
    // Filesystem isn't writable — fall back to an in-memory store so the app
    // keeps working (e.g. on read-only serverless hosting).
    memoryStore = sorted;
    if (!warnedReadOnly) {
      warnedReadOnly = true;
      console.warn(
        "[db] data file is not writable; using in-memory store for this session.",
        err instanceof Error ? err.message : err,
      );
    }
  }
}

/** Run a read-modify-write mutation atomically with respect to other writers. */
function withLock<T>(fn: (events: CulturalEvent[]) => Promise<T> | T): Promise<T> {
  const next = writeChain.then(async () => {
    const events = await readAll();
    return fn(events);
  });
  // Keep the chain alive even if a mutation rejects.
  writeChain = next.catch(() => undefined);
  return next;
}

export interface EventQuery {
  categories?: CategoryId[];
  minImpact?: number;
  from?: string;
  to?: string;
}

export async function queryEvents(query: EventQuery = {}): Promise<CulturalEvent[]> {
  const events = await readAll();
  return events
    .filter((e) => {
      if (query.categories?.length && !query.categories.includes(e.category)) {
        return false;
      }
      if (typeof query.minImpact === "number" && e.impactScore < query.minImpact) {
        return false;
      }
      if (query.from && (e.endDate ?? e.startDate) < query.from) return false;
      if (query.to && e.startDate > query.to) return false;
      return true;
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export async function getEvent(id: string): Promise<CulturalEvent | undefined> {
  const events = await readAll();
  return events.find((e) => e.id === id);
}

function normalize(input: NewCulturalEvent): Omit<CulturalEvent, "id" | "source"> {
  if (!input.title || typeof input.title !== "string") {
    throw new Error("`title` is required");
  }
  if (!isValidCategory(input.category)) {
    throw new Error("`category` must be one of the five taxonomy pillars");
  }
  if (!input.startDate || !/^\d{4}-\d{2}-\d{2}/.test(input.startDate)) {
    throw new Error("`startDate` must be an ISO date (YYYY-MM-DD)");
  }
  const impact = Number(input.impactScore);
  if (Number.isNaN(impact) || impact < 1 || impact > 10) {
    throw new Error("`impactScore` must be a number between 1 and 10");
  }
  const status =
    input.status === "rumored" || input.status === "projected"
      ? input.status
      : "confirmed";
  return {
    title: input.title.trim(),
    category: input.category,
    subCategory: input.subCategory ?? "",
    startDate: input.startDate,
    endDate: input.endDate,
    impactScore: Math.round(impact * 10) / 10,
    commercialDrivers: Array.isArray(input.commercialDrivers)
      ? input.commercialDrivers
      : [],
    partnershipAngle: input.partnershipAngle ?? "",
    sourceUrls: Array.isArray(input.sourceUrls) ? input.sourceUrls : [],
    announcedDate: input.announcedDate,
    headliners: Array.isArray(input.headliners) ? input.headliners : [],
    description: input.description ?? "",
    status,
  };
}

export async function createEvent(
  input: NewCulturalEvent,
): Promise<CulturalEvent> {
  const base = normalize(input);
  return withLock(async (events) => {
    const event: CulturalEvent = {
      ...base,
      id: input.id ?? randomUUID(),
      source: input.source ?? "curated",
    };
    events.push(event);
    await persist(events);
    return event;
  });
}

export async function updateEvent(
  id: string,
  patch: Partial<NewCulturalEvent>,
): Promise<CulturalEvent | undefined> {
  return withLock(async (events) => {
    const idx = events.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    const merged = { ...events[idx], ...patch, id } as CulturalEvent;
    // Re-validate the merged result.
    const normalized = normalize(merged);
    events[idx] = { ...merged, ...normalized };
    await persist(events);
    return events[idx];
  });
}

export async function deleteEvent(id: string): Promise<boolean> {
  return withLock(async (events) => {
    const idx = events.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    events.splice(idx, 1);
    await persist(events);
    return true;
  });
}

export interface SyncResult {
  added: number;
  updated: number;
  skipped: number;
  total: number;
}

/**
 * Merge an upstream batch of ingested events without clobbering curated work.
 *
 * - Curated events (`source === "curated"`) are never overwritten.
 * - Previously ingested events with a matching id are refreshed in place.
 * - Everything else is appended.
 */
export async function syncEvents(
  incoming: NewCulturalEvent[],
): Promise<SyncResult> {
  return withLock(async (events) => {
    const byId = new Map(events.map((e) => [e.id, e]));
    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const raw of incoming) {
      let base: Omit<CulturalEvent, "id" | "source">;
      try {
        base = normalize(raw);
      } catch {
        skipped++;
        continue;
      }
      const id = raw.id ?? randomUUID();
      const existing = byId.get(id);

      if (existing) {
        if (existing.source === "curated") {
          skipped++; // Protect curated events from automated overwrites.
          continue;
        }
        const refreshed: CulturalEvent = {
          ...existing,
          ...base,
          id,
          source: "ingested",
        };
        byId.set(id, refreshed);
        updated++;
      } else {
        byId.set(id, { ...base, id, source: "ingested" });
        added++;
      }
    }

    const next = Array.from(byId.values());
    await persist(next);
    return { added, updated, skipped, total: next.length };
  });
}

export { DATA_FILE };
