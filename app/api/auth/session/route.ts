import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE,
} from "@/lib/auth-server";
import type { UserProfile } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);

    if (!decoded.email?.endsWith("@wisc.edu")) {
      await auth.revokeRefreshTokens(decoded.uid);
      return NextResponse.json(
        { error: "Only @wisc.edu emails are allowed" },
        { status: 403 }
      );
    }

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_COOKIE_MAX_AGE * 1000,
    });

    const db = getAdminDb();
    const userRef = db.collection("users").doc(decoded.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      const now = Date.now();
      const newUser: UserProfile = {
        uid: decoded.uid,
        email: decoded.email,
        displayName: decoded.name || decoded.email.split("@")[0],
        photoURL: decoded.picture || "",
        major: "",
        year: "Freshman",
        currentClasses: [],
        hobbies: [],
        meetPreferences: [],
        resumeUrl: null,
        extractedResume: null,
        profileComplete: false,
        currentMatchId: null,
        calendarLinked: false,
        calendarTokens: null,
        punishment: { badged: false, badgeExpiresAt: null },
        createdAt: now,
        updatedAt: now,
      };
      await userRef.set(newUser);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("Session creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
