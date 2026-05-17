# Week 2 — Spotify OAuth & First API Calls

**Theme:** By end of this week, you can log into your app with your real Spotify account and call the Spotify Web API with the user's access token.

## End-of-Week Deliverables

- Spotify Developer app registered with Client ID/Secret
- Auth.js configured with Spotify provider
- "Sign in with Spotify" button that completes the full OAuth round trip
- Logged-in users see their profile info (name, picture) and a sign-out button
- Server-side endpoint that calls the Spotify API with the user's access token
- Verified by fetching and displaying the user's playlist count

## Branch Workflow (every day)

1. `git checkout main && git pull`
2. `git checkout -b <branch-name>`
3. Do the work, commit on the branch
4. `git push -u origin <branch-name>`
5. Open PR on GitHub, review your own diff, merge, delete branch on GitHub
6. Locally: `git checkout main && git pull && git branch -d <branch-name>`

---

## Day 1 — Spotify Developer Dashboard setup (~1 hr)

**Branch:** `chore/spotify-dev-setup`

1. Go to https://developer.spotify.com/dashboard and log in.
2. Click "Create app." Fill in:
   - App name: `playlist-splitter`
   - Description: `Splits Spotify playlists by audio similarity (portfolio project)`
   - Redirect URI: `http://127.0.0.1:3000/api/auth/callback/spotify` (use `127.0.0.1`, not `localhost` — Spotify now requires this for local dev)
   - APIs: select "Web API"
3. Agree to terms and create the app.
4. In Settings, copy the Client ID and Client Secret.
5. Create `frontend/.env.local` (this file is gitignored):
   ```
   AUTH_SECRET=
   AUTH_SPOTIFY_ID=your_client_id_here
   AUTH_SPOTIFY_SECRET=your_client_secret_here
   ```
6. Generate `AUTH_SECRET`: in `frontend/`, run `npx auth secret`. Paste result into `.env.local`.
7. Create `frontend/.env.example` (this DOES get committed, as a template):
   ```
   AUTH_SECRET=
   AUTH_SPOTIFY_ID=
   AUTH_SPOTIFY_SECRET=
   ```
8. Verify `.env.local` is in `.gitignore` (it should be). NEVER commit it.
9. Commit `.env.example` only, PR, merge, cleanup.

---

## Day 2 — Install and configure Auth.js (~1.5 hrs)

**Branch:** `chore/install-auth-js`

**Heads up:** there are two versions of this library — old "NextAuth v4" and current "Auth.js v5." We're using v5. When you find tutorials, double-check they're v5. Stick to https://authjs.dev for canonical docs.

1. From `frontend/`: `npm install next-auth@beta`
2. Create `frontend/auth.ts` at the project root. Ask Claude Code to write a minimal Auth.js v5 config with the Spotify provider. Should export `auth`, `signIn`, `signOut`, `handlers`. Spotify scopes needed:
   - `user-read-email`
   - `user-read-private`
   - `playlist-read-private`
   - `playlist-modify-private`
   - `playlist-modify-public`
3. Read the generated code and understand: the provider configures how OAuth works with Spotify; scopes are the permissions you're requesting.
4. No running yet — Day 3 wires up the routes.
5. Commit, PR, merge, cleanup.

---

## Day 3 — Wire up Auth.js routes and session (~1-2 hrs)

**Branch:** `feature/auth-routes`

1. Create `frontend/app/api/auth/[...nextauth]/route.ts`. Two lines: import handlers from `@/auth` and export GET and POST.
2. In `frontend/app/layout.tsx`, wrap `{children}` in `<SessionProvider>` from `next-auth/react`.
3. **Concept:** the `[...nextauth]` route handles all OAuth callbacks behind the scenes. Auth.js writes this logic, but understand it's what's running.
4. Run `npm run dev`. Visit `http://localhost:3000/api/auth/signin` — should show Auth.js's default sign-in page with a Spotify button.
5. Commit, PR, merge, cleanup.

---

## Day 4 — Build login UI and test full OAuth round trip (~1.5-2 hrs)

**Branch:** `feature/spotify-login`

1. On the home page (`frontend/app/page.tsx`), replace the previous "fetch from backend" button with a "Sign in with Spotify" button that calls `signIn("spotify")` from `next-auth/react`.
2. Run `npm run dev`. Open `http://127.0.0.1:3000` (use 127.0.0.1, not localhost, to match redirect URI).
3. Click the button → redirected to Spotify → Spotify asks for permission → click Agree → land back at your app, now logged in.

**Likely gotchas:**
- Wrong redirect URI → must exactly match Spotify dashboard, trailing slashes matter
- "Invalid client" → env vars not loading; restart `npm run dev` after editing `.env.local`

4. Second big "it works" moment. Pause and appreciate.
5. Commit, PR, merge, cleanup.

---

## Day 5 — Display authenticated user info (~1 hr)

**Branch:** `feature/auth-user-display`

1. On home page, use `useSession` hook from `next-auth/react` to get session.
2. Handle three render states: loading, signed in, signed out.
3. Signed in: show display name, profile picture, "Sign out" button (calls `signOut()`).
4. Signed out: show "Sign in with Spotify" button.
5. Test: log in → see profile → log out → back to sign-in button.
6. Commit, PR, merge, cleanup.

---

## Day 6 — First server-side Spotify API call (~2 hrs)

**Branch:** `feature/first-spotify-api-call`

Most substantive day of the week.

1. Update `frontend/auth.ts` to expose `access_token` in the session via callbacks. Pattern:
   - `jwt` callback captures `account.access_token`
   - `session` callback pipes it from `token` to `session`
   - Claude Code can write this — read it carefully, it's where most Auth.js confusion lives.
2. Create `frontend/app/api/spotify/playlists/route.ts`:
   - Get session via `auth()`
   - No session → return 401
   - Otherwise → fetch `https://api.spotify.com/v1/me/playlists` with `Authorization: Bearer <access_token>`
   - Return the response JSON
3. On home page (when signed in): button "Fetch my playlist count" → calls `/api/spotify/playlists` → displays `total` from response.
4. Test. You should see your real Spotify playlist count.
5. **Security concept:** notice the browser never sees the access token. Browser calls your backend, your backend calls Spotify with the token. This is correct — never expose access tokens to frontend JS.
6. Commit, PR, merge, cleanup.

---

## Day 7 — Wrap up + plan Week 3 (~30-60 min)

**Branch:** `chore/week-2-wrapup`

1. Confirm Days 1-6 are merged into `main` on GitHub.
2. Update `CLAUDE.md`: mark Week 2 complete, add a Week 2 Retrospective.
3. Commit, PR, merge, cleanup.
4. Come back to chat to plan Week 3.

---

## If You Get Stuck

- Auth.js v5 callbacks are the most likely place to hit weirdness on Day 6. Paste any errors here.
- For OAuth flow issues: redirect URI exactness + restart dev server after env changes solves 80% of problems.
- Concept confusion → ask in this chat
- Code/error → ask Claude Code in your repo