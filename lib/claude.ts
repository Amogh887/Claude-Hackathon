import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type {
  ExtractedResume,
  EventSuggestion,
  FreeWindow,
  RawEvent,
  UserProfile,
} from "./types";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

function extractJson<T>(text: string): T {
  const stripped = text
    .replace(/^```(?:json)?\n?/, "")
    .replace(/\n?```$/, "")
    .trim();
  const start = Math.min(
    ...["{", "["]
      .map((c) => stripped.indexOf(c))
      .filter((i) => i >= 0)
  );
  const end = Math.max(stripped.lastIndexOf("}"), stripped.lastIndexOf("]"));
  const json =
    start >= 0 && end >= 0 ? stripped.substring(start, end + 1) : stripped;
  return JSON.parse(json) as T;
}

export async function parseResumeFromPdf(
  pdfBytes: Buffer
): Promise<ExtractedResume> {
  const base64 = pdfBytes.toString("base64");
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system:
      "You extract structured data from resumes. Return ONLY a valid JSON object matching the schema. No prose, no markdown.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: `Extract the following from this resume as JSON:
{
  "skills": ["specific technical skills, tools, languages, frameworks"],
  "experiences": ["one-line summaries of each job/internship"],
  "projects": ["one-line summaries of each project"],
  "clubs": ["club names, RSOs, organizations"],
  "summary": "a 2-sentence professional summary"
}
Return ONLY the JSON object. No other text.`,
          },
        ],
      },
    ],
  });

  const text = (message.content[0] as { type: "text"; text: string }).text;
  return extractJson<ExtractedResume>(text);
}

export async function skillSimilarityScore(
  resumeA: ExtractedResume,
  resumeB: ExtractedResume
): Promise<number> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    system:
      "You rate how well two students' skills/experiences complement each other for collaboration. Return ONLY a JSON object with a single integer field 'score' (0-10).",
    messages: [
      {
        role: "user",
        content: `Student A:
skills: ${resumeA.skills.join(", ")}
projects: ${resumeA.projects.join(" | ")}
clubs: ${resumeA.clubs.join(", ")}

Student B:
skills: ${resumeB.skills.join(", ")}
projects: ${resumeB.projects.join(" | ")}
clubs: ${resumeB.clubs.join(", ")}

How well do these two students complement each other for collaboration or professional networking? Score 0-10 where 10 = perfect synergy (overlapping interests, complementary skills) and 0 = no overlap at all.

Return ONLY: {"score": <number>}`,
      },
    ],
  });

  const text = (message.content[0] as { type: "text"; text: string }).text;
  const parsed = extractJson<{ score: number }>(text);
  return Math.max(0, Math.min(10, parsed.score));
}

const SUGGEST_SYSTEM_PROMPT = `You are a UW-Madison meeting planner helping two students meet in person for the first time.

You receive:
- Two student profiles (major, classes, hobbies, skills, meeting preferences)
- Shared free time windows from both calendars
- A list of real events discovered from the web (club meetings, hackathons, symposiums, lectures, movies at Union South, etc.)

You must propose EXACTLY 3 meeting suggestions covering a variety of vibes:

SUGGESTION 1 — REAL UW EVENT:
Must come from the discoveredEvents list. Prefer club meetings, RSO events, hackathons, symposiums, lectures, workshops, or movies at Union South. Set isRealEvent: true and put the source URL in sourceUrl.

SUGGESTION 2 — CASUAL CAMPUS / STATE STREET:
A coffee chat or low-key hangout. Pick a real place like: Colectivo on State Street, Ancora Coffee, Michelangelo's Coffee House, Memorial Union Terrace, Rathskeller, Babcock Hall Dairy Store, Gordon's Market, Union South Sett, or similar. Set isRealEvent: false.

SUGGESTION 3 — CREATIVE PICK:
Something more distinctive. Could be a movie at Union South's Marquee Cinema, Rathskeller trivia night, ice skating at the Shell, a walk along Lakeshore Path to Picnic Point, Nick's climbing gym, bowling at the Sett, or another real event from discoveredEvents. Pick based on the students' meetPreferences (active / coffee_chat / moderate).

RULES:
- Each suggestion MUST have a specific dateTime (ISO 8601) that falls inside ONE of the provided free windows.
- Each suggestion's "type" must be one of: "active", "coffee_chat", or "moderate".
- "whyThisWorks" must be 2 sentences that reference BOTH students' actual classes/hobbies/projects by name.
- "verifyTime" should be true only if the event comes from discoveredEvents AND dateConfidence was "low" or "none".
- "location" should be specific and real (building name, address, or campus landmark).
- Return ONLY a valid JSON array of 3 EventSuggestion objects. No prose, no markdown, no explanation.

Schema:
[
  {
    "id": "sug-1",
    "title": "...",
    "description": "...",
    "location": "...",
    "dateTime": "2024-01-15T15:00:00-06:00",
    "type": "coffee_chat",
    "sourceUrl": "https://..." | null,
    "whyThisWorks": "...",
    "isRealEvent": true,
    "verifyTime": false
  }
]`;

export async function suggestMeetings(
  userA: UserProfile,
  userB: UserProfile,
  sharedWindows: FreeWindow[],
  discoveredEvents: RawEvent[]
): Promise<EventSuggestion[]> {
  const profileA = {
    major: userA.major,
    year: userA.year,
    classes: userA.currentClasses,
    hobbies: userA.hobbies,
    meetPreferences: userA.meetPreferences,
    skills: userA.extractedResume?.skills || [],
    projects: userA.extractedResume?.projects || [],
    clubs: userA.extractedResume?.clubs || [],
  };
  const profileB = {
    major: userB.major,
    year: userB.year,
    classes: userB.currentClasses,
    hobbies: userB.hobbies,
    meetPreferences: userB.meetPreferences,
    skills: userB.extractedResume?.skills || [],
    projects: userB.extractedResume?.projects || [],
    clubs: userB.extractedResume?.clubs || [],
  };

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SUGGEST_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Student A:
${JSON.stringify(profileA, null, 2)}

Student B:
${JSON.stringify(profileB, null, 2)}

Shared free windows (both users available):
${JSON.stringify(sharedWindows, null, 2)}

Discovered real UW-Madison events from the web:
${JSON.stringify(discoveredEvents, null, 2)}

Propose exactly 3 meeting suggestions following the system rules. Return ONLY the JSON array.`,
      },
    ],
  });

  const text = (message.content[0] as { type: "text"; text: string }).text;
  return extractJson<EventSuggestion[]>(text);
}

export async function suggestCompromise(
  userA: UserProfile,
  userB: UserProfile,
  voteA: EventSuggestion,
  voteB: EventSuggestion,
  sharedWindows: FreeWindow[]
): Promise<EventSuggestion> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system:
      "You are a meeting mediator. Two students voted for different events. Propose ONE compromise event that blends the spirit of both choices at UW-Madison. Return ONLY a JSON object matching the EventSuggestion schema.",
    messages: [
      {
        role: "user",
        content: `Student A picked: ${JSON.stringify(voteA)}
Student B picked: ${JSON.stringify(voteB)}

Student A profile: ${userA.displayName}, ${userA.major}, hobbies: ${userA.hobbies.join(", ")}
Student B profile: ${userB.displayName}, ${userB.major}, hobbies: ${userB.hobbies.join(", ")}

Shared free windows: ${JSON.stringify(sharedWindows)}

Propose ONE compromise EventSuggestion. Pick a specific real UW-Madison location. Use id "compromise-1". Return ONLY the JSON object.`,
      },
    ],
  });

  const text = (message.content[0] as { type: "text"; text: string }).text;
  return extractJson<EventSuggestion>(text);
}
