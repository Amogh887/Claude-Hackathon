import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSession, getUserProfile } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { MatchDocument, PublicUserProfile } from "@/lib/types";
import GhostBadge from "@/components/GhostBadge";

export default async function MatchDetailPage({
  params,
}: {
  params: { matchId: string };
}) {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/login");

  const db = getAdminDb();
  const matchSnap = await db.collection("matches").doc(params.matchId).get();
  if (!matchSnap.exists) redirect("/dashboard");
  const match = matchSnap.data() as MatchDocument;
  if (match.userAId !== session.uid && match.userBId !== session.uid) {
    redirect("/dashboard");
  }

  const otherUid = match.userAId === session.uid ? match.userBId : match.userAId;
  const other = await getUserProfile(otherUid);
  if (!other) redirect("/dashboard");

  const publicOther: PublicUserProfile = {
    uid: other.uid,
    displayName: other.displayName,
    photoURL: other.photoURL,
    major: other.major,
    year: other.year,
    currentClasses: other.currentClasses,
    hobbies: other.hobbies,
    meetPreferences: other.meetPreferences,
    extractedResume: other.extractedResume,
    punishment: other.punishment,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 inline-block mb-4"
        >
          ← Dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex items-start gap-4">
            {publicOther.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={publicOther.photoURL}
                alt=""
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-2xl">
                🦡
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {publicOther.displayName}
              </h1>
              <p className="text-gray-500 text-sm">
                {publicOther.major} · {publicOther.year}
              </p>
              <GhostBadge punishment={publicOther.punishment} />
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400 uppercase tracking-wider">
                Match score
              </div>
              <div className="text-3xl font-bold text-red-600">
                {match.matchScore}
              </div>
            </div>
          </div>

          <p className="mt-6 text-gray-700 text-sm leading-relaxed">
            {match.matchReason}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                Classes
              </p>
              <p className="text-gray-700">
                {publicOther.currentClasses.join(", ") || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                Hobbies
              </p>
              <p className="text-gray-700">
                {publicOther.hobbies.join(", ") || "—"}
              </p>
            </div>
          </div>

          {publicOther.extractedResume && (
            <div className="mt-6">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {publicOther.extractedResume.skills.slice(0, 10).map((s) => (
                  <span
                    key={s}
                    className="text-xs bg-red-50 text-red-700 border border-red-100 px-3 py-1 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          {match.status === "active" && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Ready to plan a meet-up?
              </h2>
              <p className="text-gray-500 text-sm mb-5">
                Claude will pull real UW events and pick 3 that work for both of
                you. Then you each vote.
              </p>
              <Link
                href={`/matches/${match.id}/vote`}
                className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg"
              >
                Generate suggestions →
              </Link>
            </>
          )}
          {match.status === "voting" && (
            <Link
              href={`/matches/${match.id}/vote`}
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg"
            >
              Go vote on suggestions →
            </Link>
          )}
          {(match.status === "confirmed" || match.status === "compromised") && (
            <Link
              href={`/matches/${match.id}/confirmed`}
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg"
            >
              See confirmed meeting →
            </Link>
          )}
          {match.status === "no_overlap" && (
            <Link
              href={`/matches/${match.id}/vote`}
              className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-8 py-3 rounded-lg"
            >
              Compromise needed →
            </Link>
          )}
          {match.status === "completed" && (
            <p className="text-green-600 font-medium">Meeting completed 🎉</p>
          )}
          {match.status === "cancelled" && (
            <p className="text-gray-500">This match was cancelled.</p>
          )}
        </div>
      </div>
    </div>
  );
}
