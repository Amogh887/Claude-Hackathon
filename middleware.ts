import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login"];
const PUBLIC_API_PREFIXES = ["/api/auth/session", "/api/cron"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  if (
    pathname.startsWith("/api/") &&
    PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  const session = req.cookies.get("__session")?.value;
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
