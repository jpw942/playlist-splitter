import NextAuth from "next-auth";
import Spotify from "next-auth/providers/spotify";

// the scopes we request from Spotify — these are the permissions the user grants us
const scopes = [
  "user-read-email",          // read the user's email address
  "user-read-private",        // read the user's subscription level and country
  "playlist-read-private",    // read the user's private playlists
  "playlist-modify-private",  // create and edit private playlists
  "playlist-modify-public",   // create and edit public playlists
].join(" ");

// Note on redirect_uri:
// Auth.js beta.31 has a bug where it uses "localhost:3000" instead of AUTH_URL
// when building the redirect_uri for Spotify's token exchange.
// The fix lives in instrumentation.ts — a global fetch patch that intercepts
// the outgoing token request and corrects the redirect_uri before it reaches Spotify.

export const { auth, signIn, signOut, handlers } = NextAuth({
  // trustHost: true lets Auth.js read x-forwarded-host (set by our proxy)
  // so the initial authorization URL uses 127.0.0.1:3000 instead of localhost:3000
  trustHost: true,
  callbacks: {
    // Next.js normalises the internal request URL to localhost:3000 even when
    // the server is bound to 127.0.0.1.  The default redirect callback uses
    // that localhost origin as `baseUrl`, which makes the post-login redirect
    // land on localhost:3000 — where the session cookie (set for 127.0.0.1)
    // is invisible.  We override it to always redirect to the AUTH_URL origin.
    redirect({ url, baseUrl }) {
      const correctOrigin = new URL(process.env.AUTH_URL ?? baseUrl).origin;
      // relative paths → prepend the correct origin
      if (url.startsWith("/")) return `${correctOrigin}${url}`;
      // same-origin absolute URLs → allow through
      if (new URL(url).origin === correctOrigin) return url;
      // anything else (e.g. external) → fall back to the correct origin
      return correctOrigin;
    },
  },
  providers: [
    Spotify({
      clientId: process.env.AUTH_SPOTIFY_ID,
      clientSecret: process.env.AUTH_SPOTIFY_SECRET,
      // explicitly set the authorization URL so Auth.js knows where to send the user
      authorization: {
        url: "https://accounts.spotify.com/authorize",
        params: { scope: scopes },
      },
    }),
  ],
});