# Week 8 — UI/UX Polish, Results Display, and Error Handling

**Theme:** The pipeline works end-to-end, but the user has no idea what's happening after they click "Split." This week makes the app feel finished: a loading state while the job runs, a results screen showing the new sub-playlists, and proper error states if something goes wrong.

By end of this week, clicking "Split Playlist" should feel like a real product — progress feedback, a satisfying results reveal, and graceful handling of failures.

## Background: Where the UI Currently Stands

- The user can log in, browse their playlists, select one, and click "Split Playlist"
- Clicking Split creates a job and triggers FastAPI — but the UI shows nothing after that
- When processing finishes, the user has to open Spotify manually to see the results
- If anything fails, there's no error shown

## End-of-Week Deliverables

- Polling loop that checks job status after Split is triggered
- Loading/progress UI while the job is running
- Results screen showing each created sub-playlist (name + track count)
- Error state if the job fails
- General UI cleanup and polish throughout

## Branch Workflow (every day)

1. `git checkout main && git pull`
2. `git checkout -b <branch-name>`
3. Do the work, commit on the branch
4. `git push -u origin <branch-name>`
5. Open PR on GitHub, review your own diff, merge, delete branch on GitHub
6. Locally: `git checkout main && git pull && git branch -d <branch-name>`

---

## Day 1 — Add a job status API route (~1 hr)

**Branch:** `feature/job-status-endpoint`

1. Create a new Next.js API route `frontend/app/api/jobs/[jobId]/route.ts`:
   - Authenticates the session
   - Looks up the Job in the database by `jobId`
   - Returns `{ status, clusters }` where `clusters` is an array of `{ name, spotifyPlaylistId, trackCount }` from the `Cluster` table (only populated when status is `DONE`)
   - Returns 404 if the job doesn't belong to the logged-in user
2. **Concept:** The frontend needs to know when the job finishes. Rather than WebSockets (complex), we'll use polling — the browser asks "are we done yet?" every few seconds until the status is `DONE` or `FAILED`. This is a common pattern for long-running async tasks.
3. Test the route in the browser: after triggering a split, navigate to `/api/jobs/{jobId}` and confirm it returns the current status.
4. Commit, PR, merge, cleanup.

---

## Day 2 — Polling loop + loading state in the UI (~2 hrs)

**Branch:** `feature/split-loading-state`

1. After the user clicks "Split Playlist" and the job is created, start polling `GET /api/jobs/{jobId}` every 3 seconds.
2. While the job status is `PROCESSING`, show a loading UI — something like a spinner or progress message: "Analyzing your playlist…"
3. Stop polling when status reaches `DONE` or `FAILED`.
4. **Concept:** React state is key here. You'll need something like:
   - `jobId: string | null` — set when Split is clicked
   - `jobStatus: 'idle' | 'processing' | 'done' | 'failed'` — drives which UI to show
   - `useEffect` with `setInterval` (or `setTimeout` in a loop) to trigger the poll
   - Clear the interval when status is no longer `PROCESSING`
5. Make sure the polling stops when the component unmounts (return a cleanup function from `useEffect`).
6. Commit, PR, merge, cleanup.

---

## Day 3 — Results screen (~2 hrs)

**Branch:** `feature/results-screen`

1. When job status reaches `DONE`, show a results screen replacing the loading state.
2. Display each sub-playlist as a card:
   - Playlist name (e.g. "Country", "Hip-Hop")
   - Track count
   - A link or button to open it in Spotify (`https://open.spotify.com/playlist/{spotifyPlaylistId}`)
3. Add a "Split another playlist" button that resets the UI back to the playlist picker.
4. **Concept:** The `clusters` array from the job status endpoint has everything you need. Map over it and render a card for each. The Spotify deep link `https://open.spotify.com/playlist/{id}` opens the playlist directly in the Spotify app or web player.
5. Commit, PR, merge, cleanup.

---

## Day 4 — Error states (~1 hr)

**Branch:** `feature/error-states`

1. If the job status is `FAILED`, show an error message: something like "Something went wrong splitting your playlist. Please try again."
2. Add a "Try again" button that resets the state back to the playlist picker.
3. Also handle the case where the poll itself fails (network error, server down) — catch the error and show a generic message rather than silently breaking.
4. In `main.py` on the FastAPI side, wrap the entire `_process_split` function body in a try/except that sets the job status to `FAILED` on any unhandled exception, so the UI can actually detect failures:
   ```python
   try:
       # ... all the pipeline steps ...
   except Exception as e:
       print(f"Pipeline failed: {e}")
       _mark_job_failed(job_id)
   ```
5. Add a `_mark_job_failed` helper function in `main.py` that sets `status = 'FAILED'`.
6. Commit, PR, merge, cleanup.

---

## Day 5 — UI polish (~2 hrs)

**Branch:** `feature/ui-polish`

1. Go through the full user flow and identify anything that feels rough or unfinished.
2. Suggested improvements:
   - Add a subtle animation to the loading state (pulsing dots, animated spinner)
   - Make the results cards look polished (consistent spacing, good typography, hover states on the Spotify link)
   - Ensure the playlist picker still looks good when a split is in progress (disable the Split button, show it as loading)
   - Verify the UI looks good on a narrow browser window (responsive)
3. Check for any console warnings or TypeScript errors and fix them.
4. Click through the full flow — login → pick playlist → split → loading → results — and make sure it feels cohesive.
5. Commit, PR, merge, cleanup.

---

## Day 6 — Multi-playlist and edge case testing (~1 hr)

**Branch:** `feature/edge-case-testing`

1. Try splitting several different playlists (not just the test one):
   - A short playlist (5–10 tracks) — does the UI handle "only 1 cluster found" gracefully?
   - A playlist with one clear genre — does the clustering produce sensible results?
   - A very mixed playlist — does it split into multiple coherent clusters?
2. Fix any edge case bugs you find.
3. Check that the job status in Supabase is always set to `DONE` or `FAILED` (never left as `PROCESSING` after the pipeline finishes or crashes).
4. Commit any fixes, PR, merge, cleanup.

---

## Day 7 — Wrap up + plan Week 9 (~30 min)

**Branch:** `chore/week-8-wrapup`

1. Confirm Days 1-6 are merged into `main`.
2. Update `CLAUDE.md`: mark Week 8 complete, add Week 8 retrospective.
3. Commit, PR, merge, cleanup.
4. Come back to chat to plan Week 9 (deployment to Vercel + Render, custom domain, production testing).

---

## If You Get Stuck

- Polling doesn't stop → make sure `useEffect` returns a cleanup function that clears the interval.
- TypeScript errors on job status types → define an explicit type for the API response and use it in the component.
- Spotify link doesn't open the app → `https://open.spotify.com/playlist/{id}` should work; `spotify:playlist:{id}` is the deep link format for the desktop app.
- Results screen shows stale data → make sure you're reading `clusters` from the poll response, not from a stale state variable.
- Job stuck in `PROCESSING` forever → check that `_mark_job_failed` is actually being called in the exception handler in `main.py`.
