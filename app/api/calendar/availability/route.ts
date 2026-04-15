import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { requireSession } from "@/lib/auth-server";
import { computeFreeWindows, getBusyBlocks } from "@/lib/calendar";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const uid = req.nextUrl.searchParams.get("uid") || session.uid;

    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

    const busy = await getBusyBlocks(uid, now, end);
    const free = computeFreeWindows(now, end, busy);
    return NextResponse.json({ free });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "Calendar not linked") {
      return NextResponse.json({ free: [] });
    }
    console.error("availability failed:", err);
    return NextResponse.json(
      { error: "Failed to load availability" },
      { status: 500 }
    );
  }
}
