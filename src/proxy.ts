import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/** Pages anyone can open. Invite and claim pages greet visitors before they sign in. */
const PUBLIC = [/^\/$/, /^\/login$/, /^\/signup$/, /^\/verify-email$/, /^\/forgot-password$/, /^\/reset-password$/, /^\/invite\/[^/]+$/, /^\/claim\/[^/]+$/, /^\/switch-account$/];
const SIGNED_OUT_ONLY = new Set(["/login", "/signup", "/forgot-password"]);

// Optimistic check only: it looks for the cookie, not a valid session.
// Pages still verify the session on the server before showing anything private.
export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request));

  // `expired` means the server already found this cookie dead; let them log in again.
  if (SIGNED_OUT_ONLY.has(pathname) && hasSession && !searchParams.has("expired")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!hasSession && !PUBLIC.some((route) => route.test(pathname))) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    // A failed email confirmation lands here without a session; keep the reason.
    const error = searchParams.get("error");
    if (error) url.searchParams.set("error", error);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next internals, the proxied API, and files with an extension.
  matcher: ["/((?!api/|_next/|.*\\.[a-zA-Z0-9]+$).*)"],
};
