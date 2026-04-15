import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { requireSession } from "@/lib/auth-server";
import { discoverEvents } from "@/lib/serper";

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const body = await req.json().catch(() => ({}));
    const events = await discoverEvents(body?.sharedKeyword);
    return NextResponse.json({ events });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("events discover failed:", err);
    return NextResponse.json(
      { error: "Failed to discover events" },
      { status: 500 }
    );
  }
}
