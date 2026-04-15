import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { MatchDocument } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await requireSession();
    const snap = await getAdminDb()
      .collection("matches")
      .doc(params.matchId)
      .get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const match = snap.data() as MatchDocument;
    if (match.userAId !== session.uid && match.userBId !== session.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ match });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("status failed:", err);
    return NextResponse.json({ error: "Status failed" }, { status: 500 });
  }
}
