"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase-client";
import type { MeetPreference, Year } from "@/lib/types";

const YEARS: Year[] = ["Freshman", "Sophomore", "Junior", "Senior", "Grad"];
const MEET_PREFS: { value: MeetPreference; label: string; emoji: string }[] = [
  { value: "active", label: "Active (sports, climbing, walks)", emoji: "🏃" },
  { value: "coffee_chat", label: "Coffee chat", emoji: "☕" },
  { value: "moderate", label: "Moderate (movie, lecture, event)", emoji: "🎬" },
];

export default function OnboardingProfilePage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [major, setMajor] = useState("");
  const [year, setYear] = useState<Year>("Freshman");
  const [classesText, setClassesText] = useState("");
  const [hobbiesText, setHobbiesText] = useState("");
  const [meetPreferences, setMeetPreferences] = useState<MeetPreference[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUid(user.uid);
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setMajor(data.major || "");
        setYear((data.year as Year) || "Freshman");
        setClassesText((data.currentClasses || []).join(", "));
        setHobbiesText((data.hobbies || []).join(", "));
        setMeetPreferences(data.meetPreferences || []);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  function togglePref(p: MeetPreference) {
    setMeetPreferences((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;
    setError(null);

    const classes = classesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const hobbies = hobbiesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!major.trim()) return setError("Major is required");
    if (classes.length === 0) return setError("Add at least one class");
    if (hobbies.length < 1 || hobbies.length > 3)
      return setError("Pick 1–3 hobbies");
    if (meetPreferences.length === 0)
      return setError("Pick at least one meeting preference");

    setSaving(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        major: major.trim(),
        year,
        currentClasses: classes,
        hobbies,
        meetPreferences,
        updatedAt: Date.now(),
      });
      router.push("/onboarding/resume");
    } catch (err) {
      console.error(err);
      setError("Failed to save. Try again.");
      setSaving(false);
    }
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
            Step 1 of 3
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Your profile</h1>
          <p className="text-gray-500 mt-2">
            Tell us what you&apos;re studying and what you&apos;re into.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Major
            </label>
            <input
              type="text"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="Computer Science"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Year
            </label>
            <div className="flex flex-wrap gap-2">
              {YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYear(y)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    year === y
                      ? "bg-red-600 border-red-600 text-white"
                      : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Classes this semester
            </label>
            <input
              type="text"
              value={classesText}
              onChange={(e) => setClassesText(e.target.value)}
              placeholder="CS 540, MATH 340, STAT 324"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Hobbies (1–3)
            </label>
            <input
              type="text"
              value={hobbiesText}
              onChange={(e) => setHobbiesText(e.target.value)}
              placeholder="climbing, chess, film photography"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              How do you like to meet people?
            </label>
            <div className="space-y-2">
              {MEET_PREFS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => togglePref(p.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                    meetPreferences.includes(p.value)
                      ? "bg-red-50 border-red-300 text-red-900"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">{p.emoji}</span>
                  <span className="font-medium text-sm">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Continue → Resume"}
          </button>
        </form>
      </div>
    </div>
  );
}
