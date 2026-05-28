import { NextRequest, NextResponse } from "next/server";
import { deleteEvent, getEvent, updateEvent } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

/** GET /api/events/:id */
export async function GET(_req: NextRequest, { params }: Params) {
  const event = await getEvent(params.id);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json({ event });
}

/** PUT /api/events/:id — partial update. */
export async function PUT(req: NextRequest, { params }: Params) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const event = await updateEvent(params.id, body as never);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json({ event });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update event" },
      { status: 400 },
    );
  }
}

/** DELETE /api/events/:id */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const ok = await deleteEvent(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json({ deleted: true });
}
