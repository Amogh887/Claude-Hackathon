import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { requireSession, getUserProfile } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { applySkillScore, baseScore } from "@/lib/scoring";
import { skillSimilarityScore } from "@/lib/claude";
import type { MatchDocument, ScoreBreakdown, UserProfile } from "@/lib/types";

export async function POST() {
  try {
    const session = await requireSession();
    const me = await getUserProfile(session.uid);
    if (!me) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (
      me.punishment?.badged &&
      me.punishment.badgeExpiresAt &&
      me.punishment.badgeExpiresAt > Date.now()
    ) {
      return NextResponse.json(
        { error: "You are currently ghost-badged. Try again later." },
        { status: 403 }
      );
    }

    if (me.currentMatchId) {
      return NextResponse.json({
        match: { id: me.currentMatchId },
        alreadyMatched: true,
      });
    }

    const db = getAdminDb();
    const snap = await db
      .collection("users")
      .where("profileComplete", "==", true)
      .where("currentMatchId", "==", null)
      .get();

    const candidates: UserProfile[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as UserProfile;
      if (data.uid === me.uid) return;
      if (
        data.punishment?.badged &&
        data.punishment.badgeExpiresAt &&
        data.punishment.badgeExpiresAt > Date.now()
      ) {
        return;
      }
      candidates.push(data);
    });

    if (candidates.length === 0) {
      return NextResponse.json({
        match: null,
        message: "No matches available right now. Check back soon.",
      });
    }

    const scored = candidates.map((c) => ({
      user: c,
      breakdown: baseScore(me, c),
    }));
    scored.sort((a, b) => b.breakdown.total - a.breakdown.total);
    const top3 = scored.slice(0, 3);

    const withSkills: { user: UserProfile; breakdown: ScoreBreakdown }[] =
      await Promise.all(
        top3.map(async ({ user, breakdown }) => {
          if (me.extractedResume && user.extractedResume) {
            try {
              const skill = await skillSimilarityScore(
                me.extractedResume,
                user.extractedResume
              );
              return { user, breakdown: applySkillScore(breakdown, skill) };
            } catch (e) {
              console.error("skill score failed:", e);
              return { user, breakdown };
            }
          }
          return { user, breakdown };
        })
      );

    withSkills.sort((a, b) => b.breakdown.total - a.breakdown.total);
    const winner = withSkills[0];
    if (!winner) {
      return NextResponse.json({ match: null });
    }

    const matchRef = db.collection("matches").doc();
    const now = Date.now();
    const matchDoc: MatchDocument = {
      id: matchRef.id,
      userAId: me.uid,
      userBId: winner.user.uid,
      matchScore: winner.breakdown.total,
      scoreBreakdown: winner.breakdown,
      matchReason: buildReason(me, winner.user, winner.breakdown),
      status: "active",
      eventSuggestions: [],
      votes: { userA: null, userB: null },
      confirmedEvent: null,
      compromiseEvent: null,
      meetingCheckin: { userA: null, userB: null },
      checkinPromptSentAt: null,
      createdAt: now,
      confirmedAt: null,
    };

    await db.runTransaction(async (tx) => {
      const meRef = db.collection("users").doc(me.uid);
      const otherRef = db.collection("users").doc(winner.user.uid);
      const [meSnap, otherSnap] = await Promise.all([
        tx.get(meRef),
        tx.get(otherRef),
      ]);
      if (meSnap.data()?.currentMatchId || otherSnap.data()?.currentMatchId) {
        throw new Error("RACE");
      }
      tx.set(matchRef, matchDoc);
      tx.update(meRef, { currentMatchId: matchRef.id, updatedAt: now });
      tx.update(otherRef, { currentMatchId: matchRef.id, updatedAt: now });
    });

    return NextResponse.json({ match: matchDoc });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "RACE") {
      return NextResponse.json(
        { error: "That person just got matched. Try again." },
        { status: 409 }
      );
    }
    console.error("match/find failed:", err);
    return NextResponse.json({ error: "Match failed" }, { status: 500 });
  }
}

function buildReason(
  me: UserProfile,
  other: UserProfile,
  breakdown: ScoreBreakdown
): string {
  const bits: string[] = [];
  if (breakdown.classOverlap > 0) bits.push("overlapping classes");
  if (breakdown.hobbyOverlap > 0) bits.push("shared hobbies");
  if (breakdown.majorSimilarity >= 3) bits.push("same major");
  else if (breakdown.majorSimilarity > 0) bits.push("related field");
  if (breakdown.skillSimilarity >= 8) bits.push("complementary skills");
  if (bits.length === 0) bits.push("compatible meeting preferences");
  return `${me.displayName.split(" ")[0]} and ${other.displayName.split(" ")[0]} matched on ${bits.join(", ")}.`;
}
