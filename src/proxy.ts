import { NextRequest, NextResponse } from "next/server";

// Only these routes require authentication — everything else is public
const PROTECTED_PATHS = [
  "/dashboard", "/eligibility", "/farms", "/pools",
  "/monitoring", "/reports", "/verification", "/admin",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!isProtected) return NextResponse.next();

  // Check for auth session cookie (Auth.js v5 uses authjs.session-token)
  const sessionToken =
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-authjs.session-token");

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
