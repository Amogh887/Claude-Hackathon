"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "@/lib/firebase-client";

export default function OnboardingResumePage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<
    "idle" | "uploading" | "parsing" | "done"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
      else setUid(user.uid);
    });
    return () => unsub();
  }, [router]);

  async function handleUpload() {
    if (!uid || !file) return;
    setError(null);

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB.");
      return;
    }

    try {
      setProgress("uploading");
      const storageRef = ref(storage, `resumes/${uid}/resume.pdf`);
      await uploadBytes(storageRef, file, { contentType: "application/pdf" });
      const resumeUrl = await getDownloadURL(storageRef);

      setProgress("parsing");
      const res = await fetch("/api/resume/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeUrl }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to parse resume");
      }

      setProgress("done");
      router.push("/onboarding/calendar");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Upload failed");
      setProgress("idle");
    }
  }

  function handleSkip() {
    router.push("/onboarding/calendar");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">
            Step 2 of 3
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Upload your resume</h1>
          <p className="text-gray-500 mt-2">
            Claude reads it and pulls out your skills, projects, and clubs to
            find you smarter matches.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <label className="block border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-red-400 transition-colors">
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={progress !== "idle"}
            />
            <div className="text-4xl mb-3">📄</div>
            <p className="font-medium text-gray-900">
              {file ? file.name : "Click to select PDF"}
            </p>
            <p className="text-xs text-gray-400 mt-1">Max 10MB · PDF only</p>
          </label>

          {progress === "uploading" && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              Uploading to Firebase Storage…
            </p>
          )}
          {progress === "parsing" && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              Claude is reading your resume…
            </p>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || progress !== "idle"}
            className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {progress === "uploading"
              ? "Uploading…"
              : progress === "parsing"
              ? "Parsing…"
              : "Upload & parse"}
          </button>

          <button
            onClick={handleSkip}
            disabled={progress !== "idle"}
            className="mt-3 w-full text-gray-500 hover:text-gray-700 font-medium text-sm disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
