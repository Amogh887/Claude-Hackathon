import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { requireSession } from "@/lib/auth-server";
import { exchangeCodeForTokens, saveTokensForUser } from "@/lib/calendar";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const err = req.nextUrl.searchParams.get("error");

    if (err || !code) {
      return NextResponse.redirect(
        new URL("/onboarding/calendar?error=1", req.url)
      );
    }

    if (state !== session.uid) {
      return NextResponse.redirect(
        new URL("/onboarding/calendar?error=1", req.url)
      );
    }

    const tokens = await exchangeCodeForTokens(code);
    await saveTokensForUser(session.uid, tokens);

    return NextResponse.redirect(
      new URL("/onboarding/calendar?linked=1", req.url)
    );
  } catch (e) {
    console.error("Calendar callback failed:", e);
    return NextResponse.redirect(
      new URL("/onboarding/calendar?error=1", req.url)
    );
  }
}
