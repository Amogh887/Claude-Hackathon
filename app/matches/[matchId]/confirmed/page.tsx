"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { MatchDocument } from "@/lib/types";

export default function ConfirmedPage() {
  const params = useParams<{ matchId: string }>();
  const router = useRouter();
  const matchId = params.matchId;

  const [match, setMatch] = useState<MatchDocument | null>(null);
  const [checkingIn, setCheckingIn] = useState<"yes" | "no" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    const res = await fetch(`/api/matches/${matchId}/status`);
    if (!res.ok) return;
    const data = await res.json();
    setMatch(data.match);
  }

  useEffect(() => {
    loadStatus();
  }, [matchId]);

  async function checkin(didMeet: boolean) {
    setCheckingIn(didMeet ? "yes" : "no");
    try {
      const res = await fetch("/api/meetings/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, didMeet }),
      });
      if (!res.ok) throw new Error("Check-in failed");
      await loadStatus();
      if (didMeet) router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setCheckingIn(null);
    }
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  const confirmed = match.confirmedEvent || match.compromiseEvent;
  if (!confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">No confirmed event yet.</p>
      </div>
    );
  }

  const when = new Date(confirmed.dateTime);
  const whenStr = isNaN(when.getTime())
    ? confirmed.dateTime
    : when.toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

  const meetingPassed = !isNaN(when.getTime()) && when.getTime() < Date.now();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 inline-block mb-4"
        >
          ← Dashboard
        </Link>

        <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🎉</div>
            <h1 className="text-3xl font-bold text-gray-900">Meeting locked in</h1>
            <p className="text-gray-500 mt-2 text-sm">
              Show up. No phones. Just meet.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {confirmed.title}
            </h2>
            <p className="text-gray-700 text-sm mb-4">{confirmed.description}</p>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold">📍 Where:</span>{" "}
                {confirmed.location}
              </p>
              <p>
                <span className="font-semibold">🕒 When:</span> {whenStr}
              </p>
              {confirmed.verifyTime && (
                <p className="text-yellow-700 text-xs bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                  ⚠️ This event was pulled from the web — verify the exact time
                  on the source page before heading out.
                </p>
              )}
            </div>
            <p className="text-gray-500 text-xs italic border-l-2 border-green-200 pl-3 mt-4">
              {confirmed.whyThisWorks}
            </p>
            {confirmed.sourceUrl && (
              <a
                href={confirmed.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-red-600 hover:text-red-700 underline mt-3 inline-block"
              >
                Event page ↗
              </a>
            )}
          </div>

          {meetingPassed && match.status !== "completed" && (
            <div className="bg-white rounded-xl border-2 border-red-200 p-6">
              <h3 className="font-bold text-gray-900 mb-2">Did you meet?</h3>
              <p className="text-gray-500 text-sm mb-4">
                Both of you need to confirm. Ghosting = 30-day badge on your
                profile. 👻
              </p>
              {error && (
                <p className="text-red-600 text-sm mb-3">{error}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => checkin(true)}
                  disabled={!!checkingIn}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
                >
                  {checkingIn === "yes" ? "Saving…" : "✓ Yes, we met"}
                </button>
                <button
                  onClick={() => checkin(false)}
                  disabled={!!checkingIn}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg disabled:opacity-50"
                >
                  {checkingIn === "no" ? "Saving…" : "✗ No show"}
                </button>
              </div>
            </div>
          )}

          {match.status === "completed" && (
            <p className="text-center text-green-700 font-semibold">
              ✓ Meeting confirmed by both of you. On, Wisconsin! 🦡
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
