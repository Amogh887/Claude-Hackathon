import Anthropic from "@anthropic-ai/sdk";
import type { Profile, MatchResponse } from "./types";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a professional networking matchmaker for UW-Madison students.
Your job is to analyze a new student's profile and find their top 3 best matches from a pool of existing student profiles.

For each match you must:
1. Calculate a compatibility score from 1 to 10 based on: overlapping classes, complementary or matching project ideas, shared hobbies, and free time overlap.
2. Write a 2–3 sentence match reason explaining WHY they would work well together professionally or as project collaborators.
3. Extract 2–4 shared interests as short bullet strings.
4. Suggest a SPECIFIC UW-Madison campus location and a day/time window to meet, based on the free time text both profiles provide. Prefer well-known spots: Memorial Union Terrace, College Library, Grainger Hall, Gordon's Market & Deli, Union South, Babcock Hall, Rathskeller, Engineering Hall, Memorial Library.

Rules:
- Return ONLY valid JSON. No markdown, no explanation text outside the JSON.
- Always return exactly 3 matches, sorted by compatibilityScore descending.
- If free time overlap is unclear, suggest "Saturday morning" as a safe default.
- The "profile" field in each match must be the full Profile object from the candidate pool.

Output schema (exact):
{
  "matches": [
    {
      "profile": { ...full Profile object... },
      "compatibilityScore": 8,
      "matchReason": "...",
      "sharedInterests": ["...", "..."],
      "meetingSuggestion": {
        "location": "Memorial Union Terrace",
        "day": "Saturday morning",
        "rationale": "Both of you mentioned weekend mornings work well..."
      }
    }
  ]
}`;

function buildUserMessage(newProfile: Profile, seedProfiles: Profile[]): string {
  return `NEW PROFILE (find matches for this person):
${JSON.stringify(newProfile, null, 2)}

CANDIDATE POOL (choose the top 3 matches from these):
${JSON.stringify(seedProfiles, null, 2)}`;
}

export async function getMatches(
  newProfile: Profile,
  seedProfiles: Profile[]
): Promise<MatchResponse> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserMessage(newProfile, seedProfiles),
      },
    ],
  });

  const text = (message.content[0] as { type: "text"; text: string }).text;
  // Strip ```json fences if present, then find the start of the JSON object
  const stripped = text
    .replace(/^```json\n?/, "")
    .replace(/\n?```$/, "")
    .trim();
  const jsonStart = stripped.indexOf("{");
  const json = jsonStart >= 0 ? stripped.substring(jsonStart) : stripped;
  return JSON.parse(json) as MatchResponse;
}
