import type { ScoreBreakdown, UserProfile } from "./types";

const MAJOR_CLUSTERS: Record<string, string[]> = {
  STEM: [
    "computer science",
    "cs",
    "ece",
    "electrical",
    "data science",
    "math",
    "statistics",
    "stats",
    "isye",
    "industrial",
    "bme",
    "biomedical",
    "physics",
    "mechanical",
    "aerospace",
  ],
  Business: [
    "business",
    "econ",
    "economics",
    "finance",
    "mhr",
    "management",
    "marketing",
    "accounting",
    "supply chain",
  ],
  "Life Sciences": [
    "biology",
    "biochem",
    "biochemistry",
    "neuroscience",
    "neuro",
    "pharmacy",
    "pre-med",
    "genetics",
  ],
  "Social Sciences": [
    "psychology",
    "psych",
    "sociology",
    "political science",
    "polsci",
    "communication",
    "comm arts",
    "journalism",
  ],
  Humanities: [
    "english",
    "history",
    "philosophy",
    "art",
    "music",
    "languages",
    "theater",
  ],
};

function majorCluster(major: string): string | null {
  const m = major.toLowerCase();
  for (const [cluster, keywords] of Object.entries(MAJOR_CLUSTERS)) {
    if (keywords.some((k) => m.includes(k))) return cluster;
  }
  return null;
}

function normalize(arr: string[]): Set<string> {
  return new Set(arr.map((s) => s.trim().toLowerCase()));
}

function overlapCount(a: string[], b: string[]): number {
  const setA = normalize(a);
  const setB = normalize(b);
  let count = 0;
  setA.forEach((x) => {
    if (setB.has(x)) count++;
  });
  return count;
}

export function baseScore(a: UserProfile, b: UserProfile): ScoreBreakdown {
  const classOverlap = Math.min(
    overlapCount(a.currentClasses, b.currentClasses) * 3,
    12
  );
  const hobbyOverlap = Math.min(
    overlapCount(a.hobbies, b.hobbies) * 4,
    12
  );
  const meetPreferenceOverlap =
    overlapCount(a.meetPreferences, b.meetPreferences) > 0 ? 5 : 0;

  let majorSimilarity = 0;
  if (a.major && b.major) {
    if (a.major.toLowerCase().trim() === b.major.toLowerCase().trim()) {
      majorSimilarity = 3;
    } else {
      const ca = majorCluster(a.major);
      const cb = majorCluster(b.major);
      if (ca && cb && ca === cb) majorSimilarity = 1;
    }
  }

  const breakdown: ScoreBreakdown = {
    classOverlap,
    hobbyOverlap,
    meetPreferenceOverlap,
    majorSimilarity,
    skillSimilarity: 0,
    total: classOverlap + hobbyOverlap + meetPreferenceOverlap + majorSimilarity,
  };
  return breakdown;
}

export function applySkillScore(
  breakdown: ScoreBreakdown,
  skillScore0to10: number
): ScoreBreakdown {
  const skillSimilarity = Math.round(skillScore0to10 * 1.5);
  return {
    ...breakdown,
    skillSimilarity,
    total:
      breakdown.classOverlap +
      breakdown.hobbyOverlap +
      breakdown.meetPreferenceOverlap +
      breakdown.majorSimilarity +
      skillSimilarity,
  };
}

export function sharedKeyword(
  a: UserProfile,
  b: UserProfile
): string | undefined {
  const aKeys = [
    ...a.hobbies,
    ...(a.extractedResume?.skills || []),
    ...(a.extractedResume?.projects || []),
  ];
  const bKeys = [
    ...b.hobbies,
    ...(b.extractedResume?.skills || []),
    ...(b.extractedResume?.projects || []),
  ];
  const aLower = aKeys.map((s) => s.toLowerCase());
  const bLower = bKeys.map((s) => s.toLowerCase());
  for (const x of aLower) {
    for (const y of bLower) {
      if (x === y || (x.length > 3 && y.includes(x)) || (y.length > 3 && x.includes(y))) {
        return x;
      }
    }
  }
  return a.hobbies[0] || b.hobbies[0];
}
