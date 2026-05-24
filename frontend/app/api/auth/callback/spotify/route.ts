// This is the URL Spotify redirects the browser to after the user approves
// (or denies) the login. Auth.js handles everything from here:
//   1. reads the authorization code from the query string
//   2. exchanges it for access tokens (calling Spotify's /api/token endpoint)
//   3. creates a session and sets a session cookie
//   4. redirects the user back to the home page
//
// The redirect_uri fix lives in auth.ts (the global fetch interceptor),
// not here — this file just hands control to the Auth.js handler.
import { handlers } from "@/auth";

export const { GET } = handlers;