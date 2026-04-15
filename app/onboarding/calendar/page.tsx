"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-client";

export default function OnboardingCalendarPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-400 text-sm">Loading…</p>
        </div>
      }
    >
      <OnboardingCalendarPage />
    </Suspense>
  );
}

function OnboardingCalendarPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [uid, setUid] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUid(user.uid);
      const snap = await getDoc(doc(db, "users", user.uid));
      setLinked(snap.data()?.calendarLinked === true);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (params.get("linked") === "1") setLinked(true);
    if (params.get("error")) setError("Calendar linking failed. Try again.");
  }, [params]);

  async function handleLink() {
    const res = await fetch("/api/calendar/auth-url");
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  async function handleFinish() {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid), {
      profileComplete: true,
      updatedAt: Date.now(),
    });
    router.push("/dashboard");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">
            Step 3 of 3
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Link your calendar</h1>
          <p className="text-gray-500 mt-2">
            So we can find times when you and your match are both free.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {linked ? (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-4 mb-6">
              <p className="text-green-800 text-sm font-medium">
                ✓ Google Calendar linked
              </p>
              <p className="text-green-700 text-xs mt-1">
                We&apos;ll only read your free/busy times, never event details.
              </p>
            </div>
          ) : (
            <button
              onClick={handleLink}
              className="w-full bg-white border border-gray-300 hover:border-gray-400 text-gray-800 font-semibold py-3 rounded-lg flex items-center justify-center gap-3 transition-colors"
            >
              <span className="text-xl">📅</span>
              Link Google Calendar
            </button>
          )}

          <p className="text-xs text-gray-400 mt-4 text-center leading-relaxed">
            Read-only access. We only check when you&apos;re busy, never what for.
          </p>

          <button
            onClick={handleFinish}
            className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {linked ? "Finish → Dashboard" : "Skip & finish"}
          </button>
        </div>
      </div>
    </div>
  );
}
