# Week 4 — Database Setup + Pipeline Foundation

**Theme:** By end of this week, the database is set up and connected, the "Split this playlist" button exists in the UI, and the Python FastAPI service is structured for ML work. This is the last week of Month 1 — everything built here is infrastructure that Month 2 depends on.

## End-of-Week Deliverables

- Supabase project created with a PostgreSQL database
- Prisma installed and connected to Supabase, with an initial schema (jobs table)
- Clicking "Split this playlist" creates a job record in the database
- Python FastAPI service cleaned up and structured for ML work
- Next.js can successfully call the FastAPI service

## Branch Workflow (every day)

1. `git checkout main && git pull`
2. `git checkout -b <branch-name>`
3. Do the work, commit on the branch
4. `git push -u origin <branch-name>`
5. Open PR on GitHub, review your own diff, merge, delete branch on GitHub
6. Locally: `git checkout main && git pull && git branch -d <branch-name>`

---

## Day 1 — Add "Split this playlist" button to UI (~1 hr)

**Branch:** `feature/split-button`

1. In the track list view, add a "Split this playlist" button below the playlist header.
2. For now it does nothing — just a placeholder. Style it to stand out (e.g. a green button).
3. This is the core user action the whole app is building toward. Getting it in the UI now makes the rest of the weeks feel purposeful.
4. Commit, PR, merge, cleanup.

---

## Day 2 — Supabase setup (~1 hr)

**Branch:** `chore/supabase-setup`

1. Go to https://supabase.com and create a free account.
2. Create a new project called `playlist-splitter`. Pick any region close to you.
3. Once the project is ready, go to Settings → Database and copy the **connection string** (the "URI" format). It looks like `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`.
4. Add it to `frontend/.env.local` as `DATABASE_URL=...`
5. Also add it to `python/.env` (create this file if it doesn't exist) as `DATABASE_URL=...`
6. Add `DATABASE_URL=` to `frontend/.env.example` as a placeholder.
7. NEVER commit the actual connection string — it contains your database password.
8. Commit `.env.example` only, PR, merge, cleanup.

---

## Day 3 — Prisma setup + schema (~1.5 hrs)

**Branch:** `chore/prisma-setup`

1. From `frontend/`: `npm install prisma @prisma/client`
2. Run `npx prisma init --datasource-provider postgresql` — this creates `frontend/prisma/schema.prisma`.
3. Set the `DATABASE_URL` in `schema.prisma` to use the env var (it should already by default).
4. Write the initial schema. Ask Claude Code to help — you should end up with a `Job` model:
   - `id` — auto-generated UUID
   - `createdAt` — timestamp, auto-set
   - `userId` — the Spotify user ID of whoever triggered the split
   - `playlistId` — the Spotify playlist ID being split
   - `playlistName` — human-readable name (useful for display)
   - `status` — an enum: `PENDING`, `PROCESSING`, `DONE`, `FAILED`
5. Run `npx prisma db push` to create the table in Supabase.
6. **Concept:** Prisma is an ORM — it lets you interact with the database using TypeScript instead of raw SQL. `db push` syncs your schema file to the actual database.
7. Commit, PR, merge, cleanup.

---

## Day 4 — Wire up Prisma to Next.js (~1.5 hrs)

**Branch:** `feature/create-job`

1. Create `frontend/lib/prisma.ts` — a singleton Prisma client (Claude Code can write this — it's standard boilerplate).
2. Update the "Split this playlist" button to call a new API route when clicked.
3. Create `frontend/app/api/jobs/route.ts` — a POST endpoint that:
   - Reads the playlist ID and name from the request body
   - Gets the user ID from the session
   - Creates a new `Job` record in the database with status `PENDING`
   - Returns the new job's ID
4. In the UI, show a brief confirmation after clicking Split (e.g. "Job created! ID: abc123").
5. Verify in the Supabase dashboard (Table Editor) that a row actually appears after clicking.
6. Commit, PR, merge, cleanup.

---

## Day 5 — Python FastAPI cleanup (~1.5 hrs)

**Branch:** `chore/fastapi-structure`

1. The Python service is currently just a hello world. Restructure it properly:
   ```
   python/
     app/
       __init__.py
       main.py        ← FastAPI app, routes
       models.py      ← Pydantic request/response models
     .env             ← DATABASE_URL and other secrets (gitignored)
     .env.example     ← template (committed)
     requirements.txt ← or pyproject.toml if using uv
   ```
2. Add a `/health` endpoint that returns `{"status": "ok"}`.
3. Add a `/split` POST endpoint that accepts `{ playlist_id, job_id }` and for now just returns `{"message": "received", "job_id": job_id}`. The real ML logic comes in Month 2.
4. Make sure CORS is configured to allow requests from `http://127.0.0.1:3000`.
5. Commit, PR, merge, cleanup.

---

## Day 6 — Connect Next.js → FastAPI (~1 hr)

**Branch:** `feature/call-fastapi`

1. Update the job creation flow: after creating a job in the database, the Next.js API route should also call the FastAPI `/split` endpoint with the `playlist_id` and `job_id`.
2. Update the job's status to `PROCESSING` after successfully calling FastAPI.
3. Test end-to-end: click "Split this playlist" → job created in DB → FastAPI receives the call → status updated to PROCESSING.
4. **Concept:** this is the handoff point between the web layer (Next.js) and the ML layer (FastAPI). In Month 2, FastAPI will do real work here instead of just acknowledging the request.
5. Commit, PR, merge, cleanup.

---

## Day 7 — Wrap up + plan Week 5 (~30-60 min)

**Branch:** `chore/week-4-wrapup`

1. Confirm Days 1-6 are merged into `main` on GitHub.
2. Update `CLAUDE.md`: mark Week 4 complete, add a Week 4 Retrospective.
3. Commit, PR, merge, cleanup.
4. Come back to chat to plan Week 5 (Month 2 begins — audio downloads + CLAP embeddings).

---

## If You Get Stuck

- Supabase connection issues → double-check the connection string format and that `DATABASE_URL` is in `.env.local`
- Prisma `db push` failing → usually a wrong connection string or the Supabase project is still spinning up
- FastAPI CORS errors → make sure `CORSMiddleware` is added before any routes in `main.py`
- Concept confusion → ask in chat