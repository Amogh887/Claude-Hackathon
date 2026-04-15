import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { requireSession } from "@/lib/auth-server";
import { buildAuthUrl } from "@/lib/calendar";

export async function GET() {
  try {
    const session = await requireSession();
    const url = buildAuthUrl(session.uid);
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("auth-url failed:", err);
    return NextResponse.json(
      { error: "Failed to build auth URL" },
      { status: 500 }
    );
  }
}
