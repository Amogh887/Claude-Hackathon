import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getAdminDb } from "@/lib/firebase-admin";
import type { MatchDocument } from "@/lib/types";

const THIRTY_DAYS = 30 * 24 * 3600 * 1000;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const now = Date.now();
  const snap = await db
    .collection("matches")
    .where("status", "in", ["confirmed", "compromised"])
    .get();

  let punished = 0;

  for (const doc of snap.docs) {
    const match = doc.data() as MatchDocument;
    const evt = match.confirmedEvent || match.compromiseEvent;
    if (!evt) continue;
    const eventTime = new Date(evt.dateTime).getTime();
    if (isNaN(eventTime)) continue;

    const cutoff = eventTime + 24 * 3600 * 1000;
    if (now < cutoff) continue;
    if (!match.checkinPromptSentAt) continue;

    const aMissed = match.meetingCheckin.userA !== true;
    const bMissed = match.meetingCheckin.userB !== true;
    if (!aMissed && !bMissed) continue;

    const ghosts: string[] = [];
    if (aMissed) ghosts.push(match.userAId);
    if (bMissed) ghosts.push(match.userBId);

    const batch = db.batch();
    batch.update(doc.ref, { status: "cancelled" });
    for (const uid of ghosts) {
      batch.update(db.collection("users").doc(uid), {
        punishment: { badged: true, badgeExpiresAt: now + THIRTY_DAYS },
        currentMatchId: null,
        updatedAt: now,
      });
    }
    const nonGhosts = [match.userAId, match.userBId].filter(
      (u) => !ghosts.includes(u)
    );
    for (const uid of nonGhosts) {
      batch.update(db.collection("users").doc(uid), {
        currentMatchId: null,
        updatedAt: now,
      });
    }
    await batch.commit();
    punished += ghosts.length;
  }

  return NextResponse.json({ ok: true, punished });
}
