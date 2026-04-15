import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { requireSession, getUserProfile } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { suggestCompromise } from "@/lib/claude";
import { intersectWindows, computeFreeWindows, getBusyBlocks } from "@/lib/calendar";
import type { FreeWindow, MatchDocument } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { matchId } = await req.json();
    if (!matchId)
      return NextResponse.json({ error: "Missing matchId" }, { status: 400 });

    const db = getAdminDb();
    const matchRef = db.collection("matches").doc(matchId);
    const snap = await matchRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    const match = snap.data() as MatchDocument;
    if (match.userAId !== session.uid && match.userBId !== session.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (match.compromiseEvent) {
      return NextResponse.json({ compromise: match.compromiseEvent });
    }
    if (!match.votes.userA || !match.votes.userB) {
      return NextResponse.json({ error: "Need both votes first" }, { status: 400 });
    }

    const voteA = match.eventSuggestions.find((e) => e.id === match.votes.userA);
    const voteB = match.eventSuggestions.find((e) => e.id === match.votes.userB);
    if (!voteA || !voteB) {
      return NextResponse.json({ error: "Vote ids invalid" }, { status: 400 });
    }

    const [userA, userB] = await Promise.all([
      getUserProfile(match.userAId),
      getUserProfile(match.userBId),
    ]);
    if (!userA || !userB) {
      return NextResponse.json({ error: "Users missing" }, { status: 404 });
    }

    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    let shared: FreeWindow[] = [];
    try {
      const [busyA, busyB] = await Promise.all([
        userA.calendarLinked ? getBusyBlocks(userA.uid, now, end) : [],
        userB.calendarLinked ? getBusyBlocks(userB.uid, now, end) : [],
      ]);
      const freeA = computeFreeWindows(now, end, busyA);
      const freeB = computeFreeWindows(now, end, busyB);
      shared = intersectWindows(freeA, freeB, 1);
    } catch (e) {
      console.warn("compromise: failed to load availability, falling back", e);
    }
    if (shared.length === 0) {
      const fallback = new Date(now);
      fallback.setDate(fallback.getDate() + 2);
      fallback.setHours(16, 0, 0, 0);
      const fallbackEnd = new Date(fallback);
      fallbackEnd.setHours(18, 0, 0, 0);
      shared = [
        {
          start: fallback.toISOString(),
          end: fallbackEnd.toISOString(),
          durationHours: 2,
        },
      ];
    }

    const compromise = await suggestCompromise(
      userA,
      userB,
      voteA,
      voteB,
      shared
    );

    await matchRef.update({
      compromiseEvent: compromise,
    });

    return NextResponse.json({ compromise });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("compromise failed:", err);
    return NextResponse.json({ error: "Compromise failed" }, { status: 500 });
  }
}
