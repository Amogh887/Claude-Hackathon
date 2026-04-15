import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { requireSession, getUserProfile } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  computeFreeWindows,
  getBusyBlocks,
  intersectWindows,
} from "@/lib/calendar";
import { discoverEvents } from "@/lib/serper";
import { suggestMeetings } from "@/lib/claude";
import { sharedKeyword } from "@/lib/scoring";
import type { FreeWindow, MatchDocument, UserProfile } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { matchId } = await req.json();
    if (!matchId)
      return NextResponse.json({ error: "Missing matchId" }, { status: 400 });

    const db = getAdminDb();
    const matchRef = db.collection("matches").doc(matchId);
    const matchSnap = await matchRef.get();
    if (!matchSnap.exists) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    const match = matchSnap.data() as MatchDocument;
    if (match.userAId !== session.uid && match.userBId !== session.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (match.eventSuggestions && match.eventSuggestions.length > 0) {
      return NextResponse.json({ suggestions: match.eventSuggestions });
    }

    const [userA, userB] = await Promise.all([
      getUserProfile(match.userAId),
      getUserProfile(match.userBId),
    ]);
    if (!userA || !userB) {
      return NextResponse.json({ error: "User missing" }, { status: 404 });
    }

    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

    const [freeA, freeB] = await Promise.all([
      loadFree(userA, now, end),
      loadFree(userB, now, end),
    ]);
    const shared = intersectWindows(freeA, freeB, 1);

    const keyword = sharedKeyword(userA, userB);
    const discoveredEvents = await discoverEvents(keyword);

    const fallbackWindows: FreeWindow[] =
      shared.length > 0 ? shared : generateFallbackWindows(now, end);

    const suggestions = await suggestMeetings(
      userA,
      userB,
      fallbackWindows,
      discoveredEvents
    );

    await matchRef.update({
      eventSuggestions: suggestions,
      status: "voting",
    });

    return NextResponse.json({ suggestions });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("meetings/suggest failed:", err);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}

async function loadFree(
  user: UserProfile,
  start: Date,
  end: Date
): Promise<FreeWindow[]> {
  if (!user.calendarLinked) {
    return generateFallbackWindows(start, end);
  }
  try {
    const busy = await getBusyBlocks(user.uid, start, end);
    return computeFreeWindows(start, end, busy);
  } catch (e) {
    console.error("loadFree failed, using fallback:", e);
    return generateFallbackWindows(start, end);
  }
}

function generateFallbackWindows(start: Date, end: Date): FreeWindow[] {
  const windows: FreeWindow[] = [];
  for (
    let d = new Date(start);
    d <= end;
    d = new Date(d.getTime() + 24 * 3600 * 1000)
  ) {
    const ws = new Date(d);
    ws.setHours(15, 0, 0, 0);
    const we = new Date(d);
    we.setHours(18, 0, 0, 0);
    if (ws < start) continue;
    windows.push({
      start: ws.toISOString(),
      end: we.toISOString(),
      durationHours: 3,
    });
  }
  return windows;
}
