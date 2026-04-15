import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getAdminDb } from "@/lib/firebase-admin";
import type { MatchDocument } from "@/lib/types";

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

  let marked = 0;
  for (const doc of snap.docs) {
    const match = doc.data() as MatchDocument;
    const evt = match.confirmedEvent || match.compromiseEvent;
    if (!evt) continue;
    const eventTime = new Date(evt.dateTime).getTime();
    if (isNaN(eventTime)) continue;
    if (eventTime < now && match.checkinPromptSentAt == null) {
      await doc.ref.update({ checkinPromptSentAt: now });
      marked++;
    }
  }

  return NextResponse.json({ ok: true, marked });
}
