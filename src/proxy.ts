import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/register", "/api/auth"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/_next") ||
    /\.(png|jpg|svg|ico|css|js|woff|woff2)$/.test(pathname);

  if (isPublic) return NextResponse.next();

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
