import { NextRequest, NextResponse } from "next/server";
import { syncEvents } from "@/lib/db";
import { generateTrendBatch } from "@/lib/mockFeed";
import type { NewCulturalEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/events/sync
 *
 * Ingestion trigger for cron-scheduled workers. Accepts an explicit batch of
 * events in the request body (`{ events: [...] }`), or — when called with no
 * body — synthesizes a fresh mock batch from the upstream feed simulator.
 *
 * Curated events are never overwritten; see `syncEvents` in lib/db.
 */
export async function POST(req: NextRequest) {
  let incoming: NewCulturalEvent[];

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null; // Empty/invalid body → fall back to generated batch.
  }

  if (body && typeof body === "object" && Array.isArray((body as any).events)) {
    incoming = (body as { events: NewCulturalEvent[] }).events;
  } else if (Array.isArray(body)) {
    incoming = body as NewCulturalEvent[];
  } else {
    incoming = generateTrendBatch();
  }

  try {
    const result = await syncEvents(incoming);
    return NextResponse.json({
      ok: true,
      syncedAt: new Date().toISOString(),
      ...result,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
