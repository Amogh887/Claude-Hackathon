"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FindMatchButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/match/find", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Match failed");
      if (data.match?.id) {
        router.push(`/matches/${data.match.id}`);
        router.refresh();
      } else {
        setError(data.message || "No matches yet. Check back soon.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Match failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-10 py-4 rounded-xl text-base shadow-sm disabled:opacity-50"
      >
        {loading ? "Finding your match…" : "Find my match"}
      </button>
      {disabled && (
        <p className="text-purple-700 text-xs mt-3 font-medium">
          👻 You&apos;re ghost-badged. Can&apos;t match until it expires.
        </p>
      )}
      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
    </div>
  );
}
