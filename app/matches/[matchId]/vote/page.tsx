"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { EventSuggestion, MatchDocument } from "@/lib/types";

export default function VotePage() {
  const router = useRouter();
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;

  const [match, setMatch] = useState<MatchDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    const res = await fetch(`/api/matches/${matchId}/status`);
    if (!res.ok) {
      setError("Failed to load match");
      return null;
    }
    const data = await res.json();
    setMatch(data.match);
    return data.match as MatchDocument;
  }

  async function generateSuggestions() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/meetings/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to generate suggestions");
      }
      await loadStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setGenerating(false);
    }
  }

  async function castVote(eventId: string) {
    setVoting(eventId);
    try {
      const res = await fetch("/api/meetings/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, eventId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Vote failed");
      }
      await loadStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Vote failed");
    } finally {
      setVoting(null);
    }
  }

  async function generateCompromise() {
    setGenerating(true);
    try {
      const res = await fetch("/api/meetings/compromise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      if (!res.ok) throw new Error("Compromise failed");
      await loadStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compromise failed");
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    (async () => {
      const m = await loadStatus();
      if (m) {
        if (
          m.status === "confirmed" ||
          m.status === "compromised" ||
          m.status === "completed"
        ) {
          router.push(`/matches/${matchId}/confirmed`);
          return;
        }
        if (m.status === "active") {
          await generateSuggestions();
        }
      }
      setLoading(false);
    })();

    fetch("/api/auth/session", { method: "GET" }).catch(() => {});
    // we don't actually need the uid — we let server tell us which side we are
    // but we want to highlight whose vote is whose
    // simplest: poll status endpoint to stay in sync
    const interval = setInterval(async () => {
      const m = await loadStatus();
      if (
        m &&
        (m.status === "confirmed" ||
          m.status === "compromised")
      ) {
        router.push(`/matches/${matchId}/confirmed`);
      }
    }, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  if (loading || (!match && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500 text-sm">
            {generating ? "Claude is finding events…" : "Loading…"}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!match) return null;

  const hasVoted = match.votes.userA || match.votes.userB;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="text-4xl mb-3">🗳️</div>
          <h1 className="text-3xl font-bold text-gray-900">Pick a meeting</h1>
          <p className="text-gray-500 mt-2 text-sm">
            You and your match each pick one. If you pick the same → it&apos;s locked
            in. Otherwise we&apos;ll find a compromise.
          </p>
        </div>

        {match.status === "no_overlap" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6 text-center">
            <p className="text-yellow-900 font-semibold mb-2">
              You picked different events!
            </p>
            <p className="text-yellow-800 text-sm mb-4">
              Let Claude find a middle ground.
            </p>
            <button
              onClick={generateCompromise}
              disabled={generating}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {generating ? "Thinking…" : "Generate compromise"}
            </button>
            {match.compromiseEvent && (
              <div className="mt-6 text-left">
                <EventCard
                  event={match.compromiseEvent}
                  onVote={() => castVote(match.compromiseEvent!.id)}
                  voting={voting === match.compromiseEvent.id}
                  disabled={!!hasVoted}
                />
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          {match.eventSuggestions.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              onVote={() => castVote(e.id)}
              voting={voting === e.id}
              disabled={match.status === "no_overlap"}
            />
          ))}
        </div>

        {hasVoted && match.status === "voting" && (
          <p className="text-center text-gray-500 text-sm mt-6">
            ⏳ Waiting for your match to vote…
          </p>
        )}
      </div>
    </div>
  );
}

function EventCard({
  event,
  onVote,
  voting,
  disabled,
}: {
  event: EventSuggestion;
  onVote: () => void;
  voting: boolean;
  disabled: boolean;
}) {
  const emoji: { icon: string; label: string } =
    event.type === "active"
      ? { icon: "🏃", label: "Active" }
      : event.type === "coffee_chat"
      ? { icon: "☕", label: "Coffee chat" }
      : { icon: "🎬", label: "Moderate" };

  const when = new Date(event.dateTime);
  const whenStr = isNaN(when.getTime())
    ? event.dateTime
    : when.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
              {emoji.icon} {emoji.label}
            </span>
            {event.isRealEvent && (
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                Real event
              </span>
            )}
            {event.verifyTime && (
              <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-medium">
                Verify time
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            📍 {event.location} · 🕒 {whenStr}
          </p>
        </div>
      </div>
      <p className="text-gray-700 text-sm mb-3">{event.description}</p>
      <p className="text-gray-500 text-xs italic border-l-2 border-red-200 pl-3 mb-4">
        {event.whyThisWorks}
      </p>
      {event.sourceUrl && (
        <a
          href={event.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-red-600 hover:text-red-700 underline mr-4"
        >
          Event page ↗
        </a>
      )}
      <button
        onClick={onVote}
        disabled={voting || disabled}
        className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
      >
        {voting ? "Voting…" : "I pick this one"}
      </button>
    </div>
  );
}
