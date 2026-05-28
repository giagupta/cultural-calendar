import { NextRequest, NextResponse } from "next/server";
import { createEvent, queryEvents, type EventQuery } from "@/lib/db";
import type { CategoryId } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES: CategoryId[] = [
  "art",
  "fashion",
  "entertainment",
  "innovation",
  "pop-culture",
];

/** GET /api/events — list events with optional filters. */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const query: EventQuery = {};

  const categories = params
    .getAll("category")
    .flatMap((c) => c.split(","))
    .filter((c): c is CategoryId => VALID_CATEGORIES.includes(c as CategoryId));
  if (categories.length) query.categories = categories;

  const minImpact = params.get("minImpact");
  if (minImpact !== null && !Number.isNaN(Number(minImpact))) {
    query.minImpact = Number(minImpact);
  }

  const from = params.get("from");
  if (from) query.from = from;
  const to = params.get("to");
  if (to) query.to = to;

  const events = await queryEvents(query);
  return NextResponse.json({ events, count: events.length });
}

/** POST /api/events — create a curated event. */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const event = await createEvent(body as never);
    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create event" },
      { status: 400 },
    );
  }
}
