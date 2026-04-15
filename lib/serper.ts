import "server-only";
import type { RawEvent } from "./types";

const SERPER_URL = "https://google.serper.dev/search";

interface SerperOrganicResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
}

interface SerperResponse {
  organic?: SerperOrganicResult[];
}

async function runSearch(query: string, num = 8): Promise<SerperOrganicResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.warn("SERPER_API_KEY not set — returning empty search results");
    return [];
  }
  try {
    const res = await fetch(SERPER_URL, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num, gl: "us", hl: "en" }),
    });
    if (!res.ok) {
      console.warn("Serper API non-OK:", res.status);
      return [];
    }
    const data = (await res.json()) as SerperResponse;
    return data.organic || [];
  } catch (e) {
    console.error("Serper fetch failed:", e);
    return [];
  }
}

function currentMonthYear(): string {
  const d = new Date();
  return `${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}`;
}

function weekRange(): string {
  const now = new Date();
  const end = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
  const fmt = (x: Date) =>
    `${x.toLocaleString("en-US", { month: "short" })} ${x.getDate()}`;
  return `${fmt(now)} - ${fmt(end)}`;
}

function toRawEvent(r: SerperOrganicResult): RawEvent {
  const dateConfidence: RawEvent["dateConfidence"] = r.date
    ? "high"
    : /\b(2024|2025|2026|today|tomorrow|this week|next week|mon|tue|wed|thu|fri|sat|sun)/i.test(
        r.snippet
      )
    ? "low"
    : "none";

  return {
    title: r.title,
    snippet: r.snippet,
    link: r.link,
    parsedDate: r.date,
    dateConfidence,
  };
}

export async function discoverEvents(sharedKeyword?: string): Promise<RawEvent[]> {
  const month = currentMonthYear();
  const week = weekRange();

  const queries = [
    `UW-Madison campus events club meetings hackathon symposium workshop lecture ${week} site:union.wisc.edu OR site:events.wisc.edu OR site:win.wisc.edu OR site:engr.wisc.edu`,
    `State Street Madison coffee shops cafes things to do ${week}`,
    `Union South UW-Madison Marquee movies OR Rathskeller Memorial Union events ${month}`,
  ];
  if (sharedKeyword) {
    queries.push(
      `UW-Madison ${sharedKeyword} event club meeting workshop ${month}`
    );
  }

  const results = await Promise.all(queries.map((q) => runSearch(q)));
  const flat = results.flat();

  const seen = new Set<string>();
  const raw: RawEvent[] = [];
  for (const r of flat) {
    if (!r.link || seen.has(r.link)) continue;
    seen.add(r.link);
    raw.push(toRawEvent(r));
  }
  return raw.slice(0, 20);
}
