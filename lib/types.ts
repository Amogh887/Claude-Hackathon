export type Year = "Freshman" | "Sophomore" | "Junior" | "Senior" | "Grad";
export type MeetPreference = "active" | "coffee_chat" | "moderate";
export type EventType = MeetPreference;
export type MatchStatus =
  | "active"
  | "voting"
  | "confirmed"
  | "no_overlap"
  | "compromised"
  | "cancelled"
  | "completed";

export interface ExtractedResume {
  skills: string[];
  experiences: string[];
  projects: string[];
  clubs: string[];
  summary: string;
}

export interface Punishment {
  badged: boolean;
  badgeExpiresAt: number | null;
}

export interface EncryptedCalendarTokens {
  encrypted: string;
  iv: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  major: string;
  year: Year;
  currentClasses: string[];
  hobbies: string[];
  meetPreferences: MeetPreference[];
  resumeUrl: string | null;
  extractedResume: ExtractedResume | null;
  profileComplete: boolean;
  currentMatchId: string | null;
  calendarLinked: boolean;
  calendarTokens: EncryptedCalendarTokens | null;
  punishment: Punishment;
  createdAt: number;
  updatedAt: number;
}

export interface FreeWindow {
  start: string;
  end: string;
  durationHours: number;
}

export interface RawEvent {
  title: string;
  snippet: string;
  link: string;
  parsedDate?: string;
  parsedLocation?: string;
  dateConfidence: "high" | "low" | "none";
}

export interface EventSuggestion {
  id: string;
  title: string;
  description: string;
  location: string;
  dateTime: string;
  type: EventType;
  sourceUrl: string | null;
  whyThisWorks: string;
  isRealEvent: boolean;
  verifyTime: boolean;
}

export interface ScoreBreakdown {
  classOverlap: number;
  hobbyOverlap: number;
  meetPreferenceOverlap: number;
  majorSimilarity: number;
  skillSimilarity: number;
  total: number;
}

export interface MatchDocument {
  id: string;
  userAId: string;
  userBId: string;
  matchScore: number;
  scoreBreakdown: ScoreBreakdown;
  matchReason: string;
  status: MatchStatus;
  eventSuggestions: EventSuggestion[];
  votes: { userA: string | null; userB: string | null };
  confirmedEvent: EventSuggestion | null;
  compromiseEvent: EventSuggestion | null;
  meetingCheckin: { userA: boolean | null; userB: boolean | null };
  checkinPromptSentAt: number | null;
  createdAt: number;
  confirmedAt: number | null;
}

export interface PublicUserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  major: string;
  year: Year;
  currentClasses: string[];
  hobbies: string[];
  meetPreferences: MeetPreference[];
  extractedResume: ExtractedResume | null;
  punishment: Punishment;
}
