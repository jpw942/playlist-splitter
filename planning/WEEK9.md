# Week 9 — Deploy Everything

**Theme:** The app works locally. This week makes it live on the real internet — frontend on Vercel, ML backend on Render, connected to a custom domain — so anyone you give the link to can use it.

By end of this week, you should be able to share a URL with someone, have them log in with their Spotify account, split a playlist, and see results. No local server required.

## Background: What Needs to Change for Production

The app currently runs entirely on your laptop. Several things are hardcoded to local addresses that need to become real URLs:

- `AUTH_URL` in Vercel env vars → production domain (e.g. `https://playlistsplitter.com`)
- `FASTAPI_URL` in Vercel env vars → Render backend URL
- `allow_origins` in FastAPI CORS → Vercel production URL
- Spotify developer dashboard → needs production redirect URI added

Everything else (Supabase, Anthropic API key, Spotify credentials) already works — they just need to be copied into the new environment's env vars.

## One Thing to Know About the ML Backend

The CLAP model is large (~2GB). When Render boots your service for the first time, it will download the model, which can take several minutes. This is a one-time cost per deploy. Render's **free tier** spins the service down after 15 minutes of inactivity, so the next request after a long pause will be slow (~30–60 seconds). For the portfolio demo period, you'll want the **Starter plan (~$7/month)** which keeps it always-on — worth it so it doesn't feel broken when a recruiter tries it.

## Branch Workflow (every day)

1. `git checkout main && git pull`
2. `git checkout -b <branch-name>`
3. Do the work, commit on the branch
4. `git push -u origin <branch-name>`
5. Open PR on GitHub, review your own diff, merge, delete branch on GitHub
6. Locally: `git checkout main && git pull && git branch -d <branch-name>`

---

## Day 1 — Deploy FastAPI to Render (~2 hrs)

**Branch:** `deploy/render-backend`

1. Make sure `backend/` has a clean `requirements.txt` (or that `pyproject.toml` has all deps listed). Render needs to install your dependencies on its servers.
   - Run `uv pip freeze > requirements.txt` inside `backend/` to generate it, or verify the existing one is complete.

2. In `backend/app/main.py`, update the CORS `allow_origins` to read from an environment variable so you can easily add the Vercel URL later without changing code:
   ```python
   import os
   origins = os.environ.get("ALLOWED_ORIGINS", "http://127.0.0.1:3000").split(",")
   app.add_middleware(CORSMiddleware, allow_origins=origins, ...)
   ```

3. Go to [render.com](https://render.com) and create a new **Web Service**:
   - Connect your GitHub repo
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Instance type: **Starter** ($7/month) — needed for always-on so the ML model isn't unloading constantly

4. Add environment variables in the Render dashboard:
   - `DATABASE_URL` — your Supabase connection string
   - `ANTHROPIC_API_KEY` — your Anthropic key
   - `ALLOWED_ORIGINS` — leave blank for now (add the Vercel URL after Day 2)

5. Wait for the first deploy to finish. The first boot will download the CLAP model — this can take 5–10 minutes. Watch the logs in the Render dashboard.

6. Test the health endpoint: `curl https://<your-render-url>.onrender.com/health` should return `{"status":"ok"}`.

7. Commit the CORS change, PR, merge, cleanup.

---

## Day 2 — Deploy Next.js to Vercel (~2 hrs)

**Branch:** `deploy/vercel-frontend`

1. Go to [vercel.com](https://vercel.com) and create a new project:
   - Connect your GitHub repo
   - Root directory: `frontend`
   - Framework: Next.js (Vercel auto-detects this)
   - Click Deploy — it will probably fail on the first try because env vars aren't set yet. That's fine.

2. In the Vercel project settings → Environment Variables, add:
   - `AUTH_SECRET` — same value as your local `.env.local`
   - `AUTH_SPOTIFY_ID` — your Spotify client ID
   - `AUTH_SPOTIFY_SECRET` — your Spotify client secret
   - `DATABASE_URL` — your Supabase connection string
   - `FASTAPI_URL` — your Render backend URL (e.g. `https://playlist-splitter-backend.onrender.com`)
   - `AUTH_URL` — leave this blank for now; you'll set it to the custom domain in Day 4. For testing today, set it to the Vercel-generated URL (e.g. `https://playlist-splitter-abc123.vercel.app`)

3. **Concept — why AUTH_URL matters in production:** In development, `AUTH_URL` tells Auth.js to use `127.0.0.1:3000` for OAuth redirect URIs. In production it serves the same purpose: it's the domain that Spotify will redirect the user back to after login. If this is wrong, the OAuth login will fail.

4. Trigger a redeploy in Vercel. Check the build logs for errors. Common issues:
   - Prisma not generating client → add `"postinstall": "prisma generate"` to `frontend/package.json` scripts if it's not already there.
   - Missing env var at build time → Vercel needs vars marked as available to the build, not just runtime.

5. Once the deploy succeeds, note your Vercel URL.

6. In the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), go to your app → Edit Settings → Redirect URIs. Add:
   `https://<your-vercel-url>.vercel.app/api/auth/callback/spotify`

7. Try to sign in on the Vercel URL. Don't worry if the split doesn't work yet — just confirm auth works.

8. Commit any code changes, PR, merge, cleanup.

---

## Day 3 — Wire Up and Test End-to-End in Production (~2 hrs)

**Branch:** `deploy/production-wiring`

1. In the Render dashboard, update `ALLOWED_ORIGINS` to include your Vercel URL:
   `https://<your-vercel-url>.vercel.app`
   Trigger a redeploy on Render.

2. In the Vercel dashboard, confirm `FASTAPI_URL` points to the Render URL. Trigger a redeploy on Vercel if you changed anything.

3. Do a full end-to-end test on the production URLs:
   - Sign in with Spotify ✓
   - Browse playlists ✓
   - Click a playlist and see tracks ✓
   - Click "Split this playlist" ✓
   - See the loading spinner ✓
   - See results when done ✓

4. If anything is broken, check:
   - Render logs for backend errors
   - Vercel function logs (in the Vercel dashboard → Deployments → your deploy → Functions) for frontend API errors
   - Browser DevTools → Network tab for failed requests

5. Fix anything you find, PR, merge, cleanup.

---

## Day 4 — Custom Domain (~1 hr)

**Branch:** `deploy/custom-domain`

1. If you don't have a domain yet, buy one at [Namecheap](https://www.namecheap.com) or [Porkbun](https://porkbun.com) (~$12/year for a .com).

2. In the Vercel project settings → Domains, add your domain. Vercel will give you DNS records (an A record or CNAME) to add in your domain registrar.

3. Add the DNS records in your registrar and wait for propagation (usually 5–30 minutes, occasionally up to an hour).

4. Once the domain is active in Vercel, update:
   - `AUTH_URL` in Vercel env vars → `https://yourdomainname.com`
   - Spotify Developer Dashboard → add `https://yourdomainname.com/api/auth/callback/spotify` as a redirect URI (keep the Vercel URL too)
   - `ALLOWED_ORIGINS` in Render → add `https://yourdomainname.com` (comma-separated with the Vercel URL)

5. Test sign-in and a full split on the custom domain.

6. Commit any code changes (there may be none), PR, merge, cleanup.

---

## Day 5 — Multi-Account Testing (~1 hr)

**Branch:** `deploy/multi-account-testing`

1. **Add test users:** Your Spotify app is in Development Mode, which limits it to 25 manually-approved users. In the Spotify Developer Dashboard → your app → User Management, add the Spotify email addresses of anyone you want to let try the app.

2. Have at least one other person (friend, family member) try the full flow:
   - They should receive the invite email from Spotify or be on the list
   - They sign in on your domain
   - They split one of their playlists
   - Results appear correctly

3. Watch the Render and Vercel logs while they use it to catch any errors that only appear for other accounts.

4. Common issues at this stage:
   - Their playlists have local files → tracks show as empty (expected, Spotify limitation)
   - CORS errors → double-check `ALLOWED_ORIGINS` includes the domain they're hitting
   - Token expiry → if their session token expired mid-split, the Spotify write-back will 401

5. Fix anything you find, PR, merge, cleanup.

---

## Day 6 — Production Hardening + README (~2 hrs)

**Branch:** `chore/production-hardening`

1. **Enable Supabase RLS:** Row-Level Security on the `Job` table is currently disabled (noted when you set up Supabase). Before sharing the app publicly, enable it so users can only read their own jobs. In the Supabase dashboard → Authentication → Policies, add a policy on `Job` that checks `userId = auth.uid()`. Since your app uses Prisma with a service role key (not per-user JWTs), you may instead confirm that the connection string uses the service role — which bypasses RLS — and that no client-side direct DB access exists. The important thing is to verify no user can read another user's data.

2. **Check for hardcoded localhost URLs:** Search the codebase for `127.0.0.1` and `localhost` to make sure nothing slipped through.
   ```
   grep -r "127.0.0.1\|localhost" frontend/app --include="*.ts" --include="*.tsx"
   ```
   The sign-out `callbackUrl` in `page.tsx` has `http://127.0.0.1:3000` — update this to read from the environment or use a relative path (`/`) so it works in production.

3. **Write a README:** Create a `README.md` at the repo root covering:
   - What the app does (2–3 sentences)
   - Tech stack (bullet list)
   - How to run it locally (setup steps)
   - A link to the live demo

4. Commit, PR, merge, cleanup.

---

## Day 7 — Wrap Up + Plan Week 10 (~30 min)

**Branch:** `chore/week-9-wrapup`

1. Confirm Days 1–6 are merged into `main`.
2. Update `CLAUDE.md`: mark Week 9 complete, add Week 9 retrospective.
3. Commit, PR, merge, cleanup.
4. Come back to chat to plan Week 10 (edge cases, stress testing, README polish).

---

## If You Get Stuck

- **Render build fails** → check the build logs; often a missing dependency in `requirements.txt` or wrong Python version. Render lets you set the Python version in settings.
- **CLAP model download times out** → Render may need more memory; upgrade to the Standard plan if the Starter isn't enough.
- **Auth 400/redirect_uri_mismatch after deploy** → the redirect URI in Spotify's dashboard must exactly match what Auth.js sends. Check `AUTH_URL` is set correctly and the Spotify dashboard has the right callback URL.
- **Vercel build error "Cannot find module '.prisma/client'"** → ensure `prisma generate` runs during build. Add `"postinstall": "prisma generate"` to `frontend/package.json` scripts.
- **CORS errors in production** → open DevTools → Network, look at the preflight OPTIONS request, check `ALLOWED_ORIGINS` on Render includes the exact origin (scheme + domain + no trailing slash).
- **Sign-out redirects to wrong URL** → update the `callbackUrl` in `signOut()` calls from the hardcoded `127.0.0.1` to `/` or your production domain.
