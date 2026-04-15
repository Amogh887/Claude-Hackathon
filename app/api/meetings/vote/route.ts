import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { MatchDocument } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { matchId, eventId } = await req.json();
    if (!matchId || !eventId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const db = getAdminDb();
    const matchRef = db.collection("matches").doc(matchId);

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(matchRef);
      if (!snap.exists) throw new Error("NOT_FOUND");
      const match = snap.data() as MatchDocument;
      if (match.userAId !== session.uid && match.userBId !== session.uid) {
        throw new Error("FORBIDDEN");
      }

      const isUserA = match.userAId === session.uid;
      const votes = { ...match.votes };
      if (isUserA) votes.userA = eventId;
      else votes.userB = eventId;

      const update: Partial<MatchDocument> = { votes };

      if (votes.userA && votes.userB) {
        if (votes.userA === votes.userB) {
          const picked = match.eventSuggestions.find((e) => e.id === votes.userA);
          update.status = "confirmed";
          update.confirmedEvent = picked || null;
          update.confirmedAt = Date.now();
        } else {
          update.status = "no_overlap";
        }
      }

      tx.update(matchRef, update);
      return { ...match, ...update };
    });

    return NextResponse.json({ match: result });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("vote failed:", err);
    return NextResponse.json({ error: "Vote failed" }, { status: 500 });
  }
}
