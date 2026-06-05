import { NextResponse, type NextRequest } from "next/server";

/**
 * Minimal middleware ("proxy" in Next 16). Mirrors the surface that
 * runs first in the real codebase that triggered the CI failure:
 *   - reads cookies on every request
 *   - decides whether to redirect to a sign-in page
 *   - lets through if the request carries an `authed=1` cookie
 *
 * The matcher intentionally covers all (authed) routes — so every
 * request to /items/* runs this proxy before the page resolver does.
 */
export function proxy(request: NextRequest) {
  const authed = request.cookies.get("authed")?.value === "1";
  const pathname = request.nextUrl.pathname;

  // Public paths — landing + sign-in only.
  const isPublic = pathname === "/" || pathname.startsWith("/sign-in");
  if (!authed && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
