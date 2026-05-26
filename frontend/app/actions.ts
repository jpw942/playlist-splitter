// Server actions for authentication
// These run on the server, not in the browser.
// Keeping them in a separate file lets the home page be a client component
// (needed for useSession) while still using server-side signIn from Auth.js.
"use server";

import { signIn } from "@/auth";

// redirects the user to Spotify's login page when the sign-in form is submitted
export async function handleSignIn() {
  await signIn("spotify");
}