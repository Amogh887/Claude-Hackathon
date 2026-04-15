import "server-only";
import { google } from "googleapis";
import { getAdminDb } from "./firebase-admin";
import { decryptTokens, encryptTokens } from "./crypto";
import type { FreeWindow } from "./types";

export const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
];

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function buildAuthUrl(state: string): string {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: CALENDAR_SCOPES,
    state,
    include_granted_scopes: true,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<StoredTokens> {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Missing tokens from Google OAuth response");
  }
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expiry_date || Date.now() + 3600 * 1000,
  };
}

export async function saveTokensForUser(uid: string, tokens: StoredTokens) {
  const encrypted = encryptTokens(JSON.stringify(tokens));
  await getAdminDb().collection("users").doc(uid).update({
    calendarLinked: true,
    calendarTokens: encrypted,
    updatedAt: Date.now(),
  });
}

async function loadTokensForUser(uid: string): Promise<StoredTokens | null> {
  const snap = await getAdminDb().collection("users").doc(uid).get();
  const data = snap.data();
  if (!data?.calendarTokens) return null;
  const plaintext = decryptTokens(data.calendarTokens);
  return JSON.parse(plaintext) as StoredTokens;
}

async function getAuthedClient(uid: string) {
  const tokens = await loadTokensForUser(uid);
  if (!tokens) throw new Error("Calendar not linked");
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiresAt,
  });

  if (tokens.expiresAt < Date.now() + 60_000) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    const newTokens: StoredTokens = {
      accessToken: credentials.access_token || tokens.accessToken,
      refreshToken: credentials.refresh_token || tokens.refreshToken,
      expiresAt: credentials.expiry_date || Date.now() + 3600 * 1000,
    };
    await saveTokensForUser(uid, newTokens);
    oauth2Client.setCredentials({
      access_token: newTokens.accessToken,
      refresh_token: newTokens.refreshToken,
      expiry_date: newTokens.expiresAt,
    });
  }
  return oauth2Client;
}

export async function getBusyBlocks(
  uid: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<{ start: Date; end: Date }[]> {
  const auth = await getAuthedClient(uid);
  const cal = google.calendar({ version: "v3", auth });
  const res = await cal.freebusy.query({
    requestBody: {
      timeMin: rangeStart.toISOString(),
      timeMax: rangeEnd.toISOString(),
      timeZone: "America/Chicago",
      items: [{ id: "primary" }],
    },
  });
  const busy = res.data.calendars?.primary?.busy || [];
  return busy
    .filter((b) => b.start && b.end)
    .map((b) => ({ start: new Date(b.start!), end: new Date(b.end!) }));
}

export function computeFreeWindows(
  rangeStart: Date,
  rangeEnd: Date,
  busyBlocks: { start: Date; end: Date }[],
  dayStartHour = 8,
  dayEndHour = 22,
  minHours = 1
): FreeWindow[] {
  const sorted = [...busyBlocks].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );
  const windows: FreeWindow[] = [];

  for (
    let day = new Date(rangeStart);
    day <= rangeEnd;
    day.setDate(day.getDate() + 1)
  ) {
    const dayStart = new Date(day);
    dayStart.setHours(dayStartHour, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(dayEndHour, 0, 0, 0);
    if (dayEnd < rangeStart || dayStart > rangeEnd) continue;

    let cursor = new Date(Math.max(dayStart.getTime(), rangeStart.getTime()));
    const limit = new Date(Math.min(dayEnd.getTime(), rangeEnd.getTime()));

    const dayBusy = sorted.filter(
      (b) => b.end > cursor && b.start < limit
    );

    for (const b of dayBusy) {
      if (b.start > cursor) {
        const durationHours = (b.start.getTime() - cursor.getTime()) / 3600_000;
        if (durationHours >= minHours) {
          windows.push({
            start: cursor.toISOString(),
            end: b.start.toISOString(),
            durationHours,
          });
        }
      }
      if (b.end > cursor) cursor = new Date(b.end);
    }

    if (cursor < limit) {
      const durationHours = (limit.getTime() - cursor.getTime()) / 3600_000;
      if (durationHours >= minHours) {
        windows.push({
          start: cursor.toISOString(),
          end: limit.toISOString(),
          durationHours,
        });
      }
    }
  }

  return windows;
}

export function intersectWindows(
  a: FreeWindow[],
  b: FreeWindow[],
  minHours = 1
): FreeWindow[] {
  const out: FreeWindow[] = [];
  for (const x of a) {
    for (const y of b) {
      const start = new Date(Math.max(new Date(x.start).getTime(), new Date(y.start).getTime()));
      const end = new Date(Math.min(new Date(x.end).getTime(), new Date(y.end).getTime()));
      if (end > start) {
        const durationHours = (end.getTime() - start.getTime()) / 3600_000;
        if (durationHours >= minHours) {
          out.push({
            start: start.toISOString(),
            end: end.toISOString(),
            durationHours,
          });
        }
      }
    }
  }
  return out;
}
