import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Forces Next.js's internal nextUrl to use 127.0.0.1:3000 on auth routes.
//
// Why this is needed:
// Next.js normalises the incoming request URL to localhost:3000 internally,
// even when the server is bound to 127.0.0.1 with `next dev -H 127.0.0.1`.
// Auth.js reads nextUrl to build the redirect_uri it sends to Spotify.
// Spotify only allows http://127.0.0.1:3000/api/auth/callback/spotify, so
// without this fix Auth.js sends the wrong redirect_uri and Spotify rejects it.
//
// We limit the matcher to /api/auth/* so this never runs on regular pages —
// the x-forwarded-host override is only needed for the auth pipeline.
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-forwarded-host", "127.0.0.1:3000");
  requestHeaders.set("x-forwarded-proto", "http");

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/api/auth/:path*"],
};