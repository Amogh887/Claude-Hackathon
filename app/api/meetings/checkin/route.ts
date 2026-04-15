import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { MatchDocument } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { matchId, didMeet } = await req.json();
    if (!matchId || typeof didMeet !== "boolean") {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const db = getAdminDb();
    const matchRef = db.collection("matches").doc(matchId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(matchRef);
      if (!snap.exists) throw new Error("NOT_FOUND");
      const match = snap.data() as MatchDocument;
      if (match.userAId !== session.uid && match.userBId !== session.uid) {
        throw new Error("FORBIDDEN");
      }

      const isUserA = match.userAId === session.uid;
      const meetingCheckin = { ...match.meetingCheckin };
      if (isUserA) meetingCheckin.userA = didMeet;
      else meetingCheckin.userB = didMeet;

      const update: Partial<MatchDocument> = { meetingCheckin };

      if (
        meetingCheckin.userA === true &&
        meetingCheckin.userB === true
      ) {
        update.status = "completed";
        tx.update(matchRef, update);
        tx.update(db.collection("users").doc(match.userAId), {
          currentMatchId: null,
          updatedAt: Date.now(),
        });
        tx.update(db.collection("users").doc(match.userBId), {
          currentMatchId: null,
          updatedAt: Date.now(),
        });
      } else {
        tx.update(matchRef, update);
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("checkin failed:", err);
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
  }
}
