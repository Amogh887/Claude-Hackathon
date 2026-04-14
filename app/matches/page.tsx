"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Match } from "@/lib/types";

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 9
      ? "bg-green-100 text-green-800"
      : score >= 7
      ? "bg-yellow-100 text-yellow-800"
      : "bg-gray-100 text-gray-700";
  return (
    <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${color}`}>
      {score}/10 match
    </span>
  );
}

function MatchCard({ match, index }: { match: Match; index: number }) {
  const { profile, compatibilityScore, matchReason, sharedInterests, meetingSuggestion } = match;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Card Header */}
      <div className="p-6 border-b border-gray-50">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                Match #{index + 1}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {profile.major} · {profile.year}
            </p>
          </div>
          <ScoreBadge score={compatibilityScore} />
        </div>

        {/* Classes */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.currentClasses.map((cls) => (
            <span
              key={cls}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
            >
              {cls}
            </span>
          ))}
        </div>
      </div>

      {/* Why you match */}
      <div className="p-6 space-y-5">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Why you match
          </h3>
          <p className="text-gray-700 text-sm leading-relaxed">{matchReason}</p>
        </div>

        {/* Shared interests */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Shared interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {sharedInterests.map((interest) => (
              <span
                key={interest}
                className="text-xs bg-red-50 text-red-700 border border-red-100 px-3 py-1 rounded-full"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        {/* Their project idea */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Their project idea
          </h3>
          <p className="text-gray-600 text-sm italic leading-relaxed">
            &ldquo;{profile.projectIdea}&rdquo;
          </p>
        </div>

        {/* Meeting suggestion */}
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📍</span>
            <h3 className="text-sm font-semibold text-red-800">Where & When to Meet</h3>
          </div>
          <div className="space-y-1">
            <p className="text-red-900 font-semibold">{meetingSuggestion.location}</p>
            <p className="text-red-700 text-sm">{meetingSuggestion.day}</p>
            <p className="text-red-600 text-xs mt-2 leading-relaxed">
              {meetingSuggestion.rationale}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-red-100">
            <p className="text-xs text-red-500 font-medium text-center">
              No chat — just show up. 🤝
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("userProfile");
    if (!raw) {
      router.push("/profile");
      return;
    }

    const profile = JSON.parse(raw);

    fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    })
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => setMatches(data.matches))
      .catch(() => setError("Something went wrong. Please try again."));
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => router.push("/profile")}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!matches) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-700 font-semibold text-lg">Finding your matches...</p>
          <p className="text-gray-400 text-sm mt-1">
            This takes about 10 seconds while the AI works its magic
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h1 className="text-3xl font-bold text-gray-900">Your Matches</h1>
          <p className="text-gray-500 mt-2">
            Based on your profile, here are your top collaborators at UW-Madison.
          </p>
          <p className="text-sm text-red-600 font-medium mt-1">
            No DMs. No scheduling back-and-forth. Just show up.
          </p>
        </div>

        {/* Match Cards */}
        <div className="space-y-6">
          {matches.map((match, i) => (
            <MatchCard key={match.profile.id} match={match} index={i} />
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-10 text-center">
          <button
            onClick={() => router.push("/profile")}
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Update my profile and rematch
          </button>
        </div>
      </div>
    </div>
  );
}
