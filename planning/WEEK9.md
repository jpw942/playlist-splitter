# Week 9 — Deploy Frontend + Polish

**Theme:** Get the app live on the real internet. The ML backend runs locally only — deploying it proved too complex and expensive for a portfolio project. Instead, the frontend goes to Vercel (free), and the full split flow is documented with a screen recording and README for anyone viewing the GitHub repo.

By end of this week, you should have a live Vercel URL showing the auth flow and playlist browsing, a custom domain pointing to it, and a README with a demo recording of the full split working locally.

## Branch Workflow (every day)

1. `git checkout main && git pull`
2. `git checkout -b <branch-name>`
3. Do the work, commit on the branch
4. `git push -u origin <branch-name>`
5. Open PR on GitHub, review your own diff, merge, delete branch on GitHub
6. Locally: `git checkout main && git pull && git branch -d <branch-name>`

---

## Day 1 — Code Prep for Deploy ✓ (done)

**Branch:** `deploy/render-backend` (merged)

Cleaned up `backend/requirements.txt` to only include what the FastAPI service actually imports (the old file was a full Jupyter environment dump and was missing critical packages). Updated CORS in `backend/app/main.py` to read allowed origins from an `ALLOWED_ORIGINS` environment variable instead of hardcoding `127.0.0.1` — local dev still works unchanged since the default value is `http://127.0.0.1:3000`.

Attempted Render deployment but skipped — PyTorch + scipy build failures and the $7–$25/month cost aren't worth it for a portfolio project. The GitHub repo and a demo recording serve the same purpose for recruiters.

---

## Day 2 — Deploy Frontend to Vercel (~1 hr)

**Branch:** `deploy/vercel-frontend`

1. Go to [vercel.com](https://vercel.com) and create a new project:
   - Connect your GitHub repo
   - Root directory: `frontend`
   - Framework: Next.js (Vercel auto-detects this)

2. Add environment variables in Vercel project settings before deploying:
   - `AUTH_SECRET`
   - `AUTH_SPOTIFY_ID`
   - `AUTH_SPOTIFY_SECRET`
   - `DATABASE_URL`
   - `AUTH_URL` — set this after the first deploy once you have the Vercel URL (e.g. `https://playlist-splitter-abc123.vercel.app`)

3. Deploy. If the build fails, check the Vercel build logs — common issue is Prisma not generating the client. If that happens, add `"postinstall": "prisma generate"` to `frontend/package.json` scripts.

4. Add the Vercel URL as a redirect URI in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard):
   `https://<your-vercel-url>.vercel.app/api/auth/callback/spotify`

5. Set `AUTH_URL` in Vercel env vars to your Vercel URL, then trigger a redeploy.

6. Test that sign-in works on the Vercel URL.

7. Commit any code changes, PR, merge, cleanup.

---

## Day 3 — Test and Fix Production (~1 hr)

**Branch:** `deploy/production-fixes`

1. Sign in on the Vercel URL and confirm:
   - Auth works ✓
   - Playlists load ✓
   - Clicking a playlist shows tracks ✓
   - Split button is visible (it will fail without the backend, which is expected)

2. Fix the hardcoded sign-out URL — in `frontend/app/page.tsx`, the `signOut` calls use `callbackUrl: "http://127.0.0.1:3000"` which will send users to your local machine after signing out in production. Change it to `callbackUrl: "/"` so it redirects to the current origin instead:
   ```typescript
   signOut({ callbackUrl: "/" })
   ```
   There are two of these (one in the 401 handler, one in the sign-out button) — update both.

3. Commit, PR, merge, cleanup.

---

## Day 4 — Custom Domain (~1 hr)

**Branch:** `deploy/custom-domain`

1. If you don't have a domain yet, buy one at [Namecheap](https://www.namecheap.com) or [Porkbun](https://porkbun.com) (~$12/year for a .com).

2. In the Vercel project settings → Domains, add your domain. Vercel will give you DNS records (an A record or CNAME) to add at your registrar.

3. Add the DNS records and wait for propagation (usually 5–30 minutes).

4. Once active, update in Vercel env vars:
   - `AUTH_URL` → `https://yourdomainname.com`

5. Add the custom domain as a redirect URI in the Spotify Developer Dashboard:
   `https://yourdomainname.com/api/auth/callback/spotify`

6. Test sign-in on the custom domain.

7. Commit any code changes (there may be none), PR, merge, cleanup.

---

## Day 5 — Multi-Account Testing (~1 hr)

**Branch:** `deploy/multi-account-testing`

1. In the Spotify Developer Dashboard → your app → User Management, add the Spotify email address of at least one other person (friend or family member) so they can log in.

2. Have them open your domain, sign in, and browse their playlists. Confirm:
   - Auth works for their account ✓
   - Their playlists and tracks load correctly ✓

3. Watch the Vercel function logs for any errors.

4. Fix anything you find, PR, merge, cleanup.

---

## Day 6 — README + Demo Recording (~2 hrs)

**Branch:** `chore/readme`

1. Record a short screen recording (~60–90 seconds) of the full split flow running locally:
   - Sign in
   - Browse playlists
   - Click a playlist, see tracks
   - Click "Split this playlist"
   - Loading spinner
   - Results screen with new playlists
   - Open one in Spotify

   On macOS: use QuickTime → File → New Screen Recording, or use `cmd+shift+5`. Convert to GIF with any free tool (e.g. [ezgif.com](https://ezgif.com)) if you want it to play inline in the README.

2. Write `README.md` at the repo root covering:
   - What the app does (2–3 sentences)
   - Demo GIF or video link
   - Tech stack (bullet list — Next.js, FastAPI, PyTorch, CLAP, HDBSCAN, Supabase, Auth.js, Tailwind)
   - Architecture diagram (the one already in CLAUDE.md works)
   - How to run it locally (setup steps for both frontend and backend)
   - Link to the live frontend demo

3. Commit, PR, merge, cleanup.

---

## Day 7 — Wrap Up + Plan Week 10 (~30 min)

**Branch:** `chore/week-9-wrapup`

1. Confirm Days 1–6 are merged into `main`.
2. Update `CLAUDE.md`: mark Week 9 complete, add Week 9 retrospective.
3. Commit, PR, merge, cleanup.
4. Come back to chat to plan Week 10 (edge cases, stress testing, README polish).

---

## If You Get Stuck

- **Vercel build error "Cannot find module '.prisma/client'"** → Add `"postinstall": "prisma generate"` to `frontend/package.json` scripts.
- **Auth 400/redirect_uri_mismatch after deploy** → The redirect URI in Spotify's dashboard must exactly match what Auth.js sends. Check `AUTH_URL` is set correctly and the Spotify dashboard has the right callback URL.
- **Sign-out redirects to 127.0.0.1** → Make sure both `signOut` calls in `page.tsx` use `callbackUrl: "/"`.
- **Custom domain not working** → DNS propagation can take up to an hour. Check with [dnschecker.org](https://dnschecker.org) to see if it's propagated yet.
