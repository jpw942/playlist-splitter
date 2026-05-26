// "use client" is required here because useSession is a React hook —
// hooks can only run in the browser, not on the server.
"use client";

import { useSession, signOut } from "next-auth/react";
import { handleSignIn } from "./actions";

export default function Home() {
  // useSession returns the current session and a status string.
  // status is one of: "loading" | "authenticated" | "unauthenticated"
  // session.user contains name, email, and image from the user's Spotify profile
  const { data: session, status } = useSession();

  // while Auth.js is checking whether the user is logged in, show nothing
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // user is logged in — show their profile and a sign-out button
  if (status === "authenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-semibold">Playlist Splitter</h1>
        {/* profile picture from Spotify */}
        {session.user?.image && (
          <img
            src={session.user.image}
            alt="Profile picture"
            className="w-16 h-16 rounded-full"
          />
        )}
        {/* display name from Spotify */}
        <p className="text-lg">Welcome, {session.user?.name}</p>
        <p className="text-sm text-gray-500">{session.user?.email}</p>
        {/* sign out — redirect to 127.0.0.1:3000 so the next sign-in starts on the
            correct host (PKCE cookies are scoped to the host they were set on) */}
        <button
          onClick={() => signOut({ callbackUrl: "http://127.0.0.1:3000" })}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Sign out
        </button>
      </div>
    );
  }

  // user is not logged in — show the sign-in button
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-semibold">Playlist Splitter</h1>
      {/* submits to the server action in actions.ts, which redirects to Spotify.
          Using a server action (not client-side signIn) ensures Auth.js builds
          the redirect_uri from AUTH_URL so it matches Spotify's dashboard. */}
      <form action={handleSignIn}>
        <button
          type="submit"
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          Sign in with Spotify
        </button>
      </form>
    </div>
  );
}