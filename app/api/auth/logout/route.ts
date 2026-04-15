import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { SESSION_COOKIE_NAME } from "@/lib/auth-server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
