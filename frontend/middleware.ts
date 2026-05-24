import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// forces Auth.js to always see 127.0.0.1:3000 as the host, even if the browser
// sends localhost:3000 — this ensures the redirect_uri matches the Spotify dashboard
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-forwarded-host", "127.0.0.1:3000");
  requestHeaders.set("x-forwarded-proto", "http");

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}