"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const initialForm = {
  name: "",
  major: "",
  year: "Sophomore" as const,
  currentClasses: "",
  projectIdea: "",
  hobby: "",
  freeTime: "",
};

type Year = "Freshman" | "Sophomore" | "Junior" | "Senior" | "Grad";

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    localStorage.setItem("userProfile", JSON.stringify(form));
    router.push("/matches");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
            ← Back
          </a>
          <h1 className="text-3xl font-bold text-gray-900">Create Your Profile</h1>
          <p className="text-gray-500 mt-1">
            Tell us about yourself and we&apos;ll find your best collaborators at UW-Madison.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Jordan Smith"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Major + Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Major
              </label>
              <input
                type="text"
                name="major"
                required
                value={form.major}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                name="year"
                value={form.year}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
              >
                {(["Freshman", "Sophomore", "Junior", "Senior", "Grad"] as Year[]).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Current Classes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Classes
            </label>
            <input
              type="text"
              name="currentClasses"
              required
              value={form.currentClasses}
              onChange={handleChange}
              placeholder="e.g. CS 571, Math 340, ECON 101"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
          </div>

          {/* Project Idea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Idea
            </label>
            <textarea
              name="projectIdea"
              required
              rows={3}
              value={form.projectIdea}
              onChange={handleChange}
              placeholder="Describe a project you want to build or collaborate on. Be specific — the more detail, the better your matches."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Hobby */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              One Hobby Outside Class
            </label>
            <input
              type="text"
              name="hobby"
              required
              value={form.hobby}
              onChange={handleChange}
              placeholder="e.g. Rock climbing at Nick's, salsa dancing, homebrewing..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Free Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              When Are You Free?
            </label>
            <input
              type="text"
              name="freeTime"
              required
              value={form.freeTime}
              onChange={handleChange}
              placeholder="e.g. Weekday evenings, Saturday mornings"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {submitting ? "Finding your matches..." : "Find My Matches →"}
          </button>
        </form>
      </div>
    </div>
  );
}
