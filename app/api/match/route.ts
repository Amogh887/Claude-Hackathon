import { NextRequest, NextResponse } from "next/server";
import { getMatches } from "@/lib/claude";
import seedProfilesData from "@/data/seed-profiles.json";
import type { Profile } from "@/lib/types";

const seedProfiles = seedProfilesData as Profile[];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const profile: Profile = {
      ...body,
      id: `user-${Date.now()}`,
      currentClasses:
        typeof body.currentClasses === "string"
          ? body.currentClasses
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : body.currentClasses,
    };

    const result = await getMatches(profile, seedProfiles);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Match API error:", error);
    return NextResponse.json(
      { error: "Failed to generate matches. Please try again." },
      { status: 500 }
    );
  }
}
