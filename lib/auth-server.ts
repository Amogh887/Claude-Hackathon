import "server-only";
import { cookies } from "next/headers";
import { getAdminAuth, getAdminDb } from "./firebase-admin";
import type { UserProfile } from "./types";

export const SESSION_COOKIE_NAME = "__session";
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 5;

export async function getSessionUser(): Promise<{
  uid: string;
  email: string;
} | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(
      sessionCookie,
      true
    );
    if (!decoded.email?.endsWith("@wisc.edu")) return null;
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}

export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const doc = await getAdminDb().collection("users").doc(uid).get();
  if (!doc.exists) return null;
  return doc.data() as UserProfile;
}

export async function requireSession(): Promise<{
  uid: string;
  email: string;
}> {
  const session = await getSessionUser();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
