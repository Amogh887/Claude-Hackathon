import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession, getUserProfile } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { MatchDocument, UserProfile } from "@/lib/types";
import GhostBadge from "@/components/GhostBadge";
import LogoutButton from "@/components/LogoutButton";
import FindMatchButton from "@/components/FindMatchButton";

export default async function DashboardPage() {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/login");

  const me = await getUserProfile(session.uid);
  if (!me) redirect("/login");

  if (!me.profileComplete) {
    redirect("/onboarding/profile");
  }

  let currentMatch: MatchDocument | null = null;
  let otherUser: UserProfile | null = null;
  if (me.currentMatchId) {
    const snap = await getAdminDb()
      .collection("matches")
      .doc(me.currentMatchId)
      .get();
    if (snap.exists) {
      currentMatch = snap.data() as MatchDocument;
      const otherUid =
        currentMatch.userAId === me.uid
          ? currentMatch.userBId
          : currentMatch.userAId;
      otherUser = await getUserProfile(otherUid);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-red-600 text-lg">
            🦡 BadgerConnect
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:inline">
              {me.displayName}
            </span>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {me.displayName.split(" ")[0]}
          </h1>
          <p className="text-gray-500 mt-1">
            {currentMatch
              ? "You have an active match."
              : "Ready to meet someone new?"}
          </p>
          <GhostBadge punishment={me.punishment} />
        </div>

        {currentMatch && otherUser ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-start gap-4 mb-6">
              {otherUser.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={otherUser.photoURL}
                  alt=""
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-2xl">
                  🦡
                </div>
              )}
              <div className="flex-1">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Your match
                </p>
                <h2 className="text-xl font-bold text-gray-900">
                  {otherUser.displayName}
                </h2>
                <p className="text-sm text-gray-500">
                  {otherUser.major} · {otherUser.year}
                </p>
                <GhostBadge punishment={otherUser.punishment} />
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase">Score</p>
                <p className="text-3xl font-bold text-red-600">
                  {currentMatch.matchScore}
                </p>
              </div>
            </div>

            <p className="text-gray-700 text-sm mb-6">
              {currentMatch.matchReason}
            </p>

            <div className="flex gap-3">
              <Link
                href={`/matches/${currentMatch.id}`}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg text-center"
              >
                View match →
              </Link>
              {currentMatch.status === "voting" && (
                <Link
                  href={`/matches/${currentMatch.id}/vote`}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 rounded-lg text-center"
                >
                  Vote on suggestions
                </Link>
              )}
              {(currentMatch.status === "confirmed" ||
                currentMatch.status === "compromised") && (
                <Link
                  href={`/matches/${currentMatch.id}/confirmed`}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg text-center"
                >
                  See meeting
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Find your match
            </h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Claude will pick one student whose classes, hobbies, and skills
              line up with yours. You&apos;ll meet in person — no chat.
            </p>
            <FindMatchButton
              disabled={
                !!me.punishment?.badged &&
                !!me.punishment.badgeExpiresAt &&
                me.punishment.badgeExpiresAt > Date.now()
              }
            />
          </div>
        )}
      </main>
    </div>
  );
}
