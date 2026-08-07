# Week 7 — LLM Cluster Naming + Spotify Write-Back

**Theme:** The clusters exist in the database — now we give them names and create the actual Spotify playlists. By end of this week, clicking "Split this playlist" produces real playlists in the user's Spotify account, each with an LLM-generated name like "Late Night R&B" or "High-Energy Dance," containing only the songs that belong to that cluster.

This is the week the product becomes real from the user's point of view.

## Background: What Happens This Week

The pipeline currently ends with cluster IDs stored in the `Track` table. This week adds two final stages:

1. **LLM naming:** For each cluster, collect the track names and artists, send them to an LLM, and get back a short creative playlist name.
2. **Spotify write-back:** For each cluster, create a new Spotify playlist on the user's account and populate it with the tracks from that cluster.

After this week the full loop closes: Spotify in → audio analysis → clusters → Spotify out.

## End-of-Week Deliverables

- `Cluster` table in Postgres to store each cluster's number, LLM-generated name, and Spotify playlist ID
- LLM naming function that takes a list of track names/artists and returns a creative playlist name
- Spotify write-back function that creates playlists and populates them with tracks
- Noise tracks (cluster -1) collected into a "Miscellaneous" catch-all playlist
- Job status updated to `DONE` when all playlists are created
- Full pipeline works end-to-end from browser click to new playlists appearing in Spotify

## Branch Workflow (every day)

1. `git checkout main && git pull`
2. `git checkout -b <branch-name>`
3. Do the work, commit on the branch
4. `git push -u origin <branch-name>`
5. Open PR on GitHub, review your own diff, merge, delete branch on GitHub
6. Locally: `git checkout main && git pull && git branch -d <branch-name>`

---

## Day 1 — Add Cluster table to Prisma schema (~30 min)

**Branch:** `chore/cluster-table-schema`

1. Add a `Cluster` model to `frontend/prisma/schema.prisma`:
   ```prisma
   model Cluster {
     id                String   @id @default(cuid())
     jobId             String
     job               Job      @relation(fields: [jobId], references: [id])
     clusterNumber     Int
     name              String?
     spotifyPlaylistId String?
     createdAt         DateTime @default(now())
   }
   ```
2. Add a `clusters Cluster[]` relation to the `Job` model.
3. Run `npx prisma db push` and `npx prisma generate`.
4. **Concept:** We need a place to store each cluster's name and the resulting Spotify playlist ID so we can display them in the UI later. The `clusterNumber` links back to the `clusterId` values already stored on each `Track` row (0, 1, 2, ...). Cluster -1 (noise) will become a "Miscellaneous" playlist, handled in Day 5.
5. Commit, PR, merge, cleanup.

---

## Day 2 — Write the LLM naming function (~2 hrs)

**Branch:** `feature/llm-cluster-naming`

1. Install the Anthropic Python SDK in the backend: `uv add anthropic`.
2. Add `ANTHROPIC_API_KEY` to `backend/.env` (get your key from console.anthropic.com).
3. Create a new file `backend/app/naming.py`. Write a function `name_cluster(tracks: list[dict]) -> str`:
   - `tracks` is a list of `{"name": ..., "artist": ...}` dicts (the tracks in one cluster)
   - Build a prompt that lists the tracks and asks for a short, creative playlist name
   - Call the Anthropic API using `claude-haiku-4-5-20251001` (fast and cheap — costs fractions of a cent per cluster)
   - Return the name as a plain string (strip any quotes or extra whitespace)
4. **Concept:** We're giving the LLM a list of songs and asking "what vibe do these share?" The model has been trained on vast music knowledge, so it recognizes that Kendrick Lamar + J. Cole + Jay-Z → "West Coast Hip-Hop" without you having to program any music logic yourself. This is what makes LLM naming so powerful for a few cents.
5. Example prompt structure:
   ```
   Here are the songs in a Spotify playlist cluster:
   - "HUMBLE." by Kendrick Lamar
   - "Middle Child" by J. Cole
   - "Empire State of Mind" by Jay-Z

   Give this cluster a short, creative playlist name (2–5 words) that captures the vibe.
   Respond with only the name, no explanation.
   ```
6. Test it manually in a Python shell with a few sample tracks to verify it returns sensible names.
7. Commit on this branch (don't merge yet — Day 3 continues here).

---

## Day 3 — Wire naming into the pipeline and create Cluster rows (~1.5 hrs)

**Branch:** `feature/llm-cluster-naming` (same branch as Day 2)

1. In `naming.py`, add a function `name_all_clusters(job_id: str, tracks: list[dict]) -> dict`:
   - Groups tracks by `cluster_id` (skip -1 for now — handled in Day 5)
   - Calls `name_cluster()` for each group
   - Returns a dict mapping `cluster_number → name`
2. Add a function `save_cluster_names(job_id: str, cluster_names: dict) -> None` that inserts a `Cluster` row for each cluster using psycopg2 (with `gen_random_uuid()::text` for the ID).
3. In `main.py`, import and call these after `run_clustering`:
   ```python
   from .naming import name_all_clusters, save_cluster_names

   # in _process_split, after run_clustering(job_id):
   cluster_names = name_all_clusters(job_id, tracks)
   save_cluster_names(job_id, cluster_names)
   ```
4. **Concept:** `tracks` here is the list already in memory from `_fetch_spotify_tracks`. We pass it along to avoid re-querying the DB. The `clusterId` stored on each Track in the DB tells us which cluster each track belongs to.
5. Commit, PR, merge, cleanup.

---

## Day 4 — Write sub-playlists back to Spotify (~2 hrs)

**Branch:** `feature/spotify-write-back`

1. Create a new file `backend/app/spotify.py`. Write a function `create_cluster_playlists(job_id: str, access_token: str) -> None`:
   - Fetch the user's Spotify ID: `GET https://api.spotify.com/v1/me`
   - Fetch all Cluster rows for this job from the DB (name + clusterNumber)
   - For each cluster:
     1. Fetch all Track rows for this job where `clusterId = clusterNumber`
     2. Create a new Spotify playlist: `POST https://api.spotify.com/v1/users/{user_id}/playlists` with `{"name": cluster_name, "public": false}`
     3. Add the tracks: `POST https://api.spotify.com/v1/playlists/{playlist_id}/tracks` with `{"uris": ["spotify:track:{spotifyId}", ...]}` (Spotify allows max 100 tracks per call — handle pagination if needed)
     4. Update the `Cluster` row in the DB with `spotifyPlaylistId`
2. In `main.py`, import and call after `save_cluster_names`:
   ```python
   from .spotify import create_cluster_playlists
   create_cluster_playlists(job_id, access_token)
   ```
3. After all playlists are created, update the Job status to `DONE`:
   ```python
   # UPDATE "Job" SET status = 'DONE' WHERE id = job_id
   ```
4. **Concept:** Spotify track URIs follow the format `spotify:track:{id}` — different from the track ID you've been using. The playlist creation endpoint needs the user's Spotify ID (not the same as the access token — you have to request it separately).
5. Commit, PR, merge, cleanup.

---

## Day 5 — Handle noise tracks (~1 hr)

**Branch:** `feature/noise-playlist`

1. Noise tracks (clusterId = -1) were skipped in Day 3. Now handle them:
   - In `name_all_clusters`, check if any tracks have `clusterId = -1`
   - If yes, add a `Cluster` row for them with `clusterNumber = -1` and `name = "Miscellaneous"`
   - In `create_cluster_playlists`, include cluster -1 in the loop so these tracks get their own playlist
2. Edge case: if there are no noise tracks, skip this entirely (don't create an empty playlist).
3. **Concept:** Rather than losing noise tracks entirely, we give them a home. "Miscellaneous" is honest — these are songs that genuinely didn't fit the musical clusters. The user can decide what to do with that playlist.
4. Commit, PR, merge, cleanup.

---

## Day 6 — End-to-end test (~1 hr)

**Branch:** `feature/write-back-e2e-test`

1. Run the full pipeline from the browser with a playlist of 30+ tracks spanning multiple genres.
2. Check Supabase — verify Cluster rows exist with non-null `name` and `spotifyPlaylistId`.
3. Open Spotify — verify the new playlists appear in the user's library with the correct names and tracks.
4. Spot-check that tracks ended up in the right playlists (the groupings should be musically coherent).
5. If anything is broken, debug and fix.
6. Commit, PR, merge, cleanup.

---

## Day 7 — Wrap up + plan Week 8 (~30-60 min)

**Branch:** `chore/week-7-wrapup`

1. Confirm Days 1-6 are merged into `main`.
2. Update `CLAUDE.md`: mark Week 7 complete, add Week 7 retrospective.
3. Commit, PR, merge, cleanup.
4. Come back to chat to plan Week 8 (UI/UX showing results, loading states, and polishing the experience).

---

## If You Get Stuck

- Anthropic API key issues → double-check `ANTHROPIC_API_KEY` is in `backend/.env` and that you've loaded it with `load_dotenv()`.
- LLM returns extra text (explanation, quotes) → add `strip()` and strip surrounding quotes. Or tighten the prompt: "Respond with only the playlist name, nothing else."
- Spotify playlist creation 403 → make sure the access token has the `playlist-modify-private` scope. Check `frontend/auth.ts` scope list.
- Spotify track URI format → must be `spotify:track:{id}`, not just the bare track ID.
- Job status never reaches DONE → add a `try/except` around the full `_process_split` body that sets status to `FAILED` on any unhandled exception.
- Noise playlist is empty → the filter for `clusterId = -1` may be off; check that HDBSCAN actually produced some -1 labels in the DB.
