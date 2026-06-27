# Week 5 — Audio Downloads + CLAP Embeddings

**Theme:** Month 2 begins. By end of this week, the FastAPI service can take a playlist, download 30-second audio previews for each track, run them through the CLAP model, and store the resulting embedding vectors in Postgres. This is the core ML work the whole project is built around.

## Background: What is CLAP?

CLAP (Contrastive Language-Audio Pretraining) is a pretrained model from LAION. It was trained on millions of (audio, text description) pairs — it learned to put similar audio near each other in a high-dimensional vector space. When we feed a 30-second audio clip into CLAP, it returns a 512-dimensional vector (a list of 512 floats). Two clips that sound similar will have vectors that point in a similar direction. That's the foundation for clustering.

We use the model from Hugging Face: `laion/clap-htsat-unfused`.

**Important note on Spotify preview URLs:** Spotify provides 30-second preview clips for most (but not all) tracks. Tracks without a preview URL (`null`) will be skipped — they simply won't be included in the clustering. Some playlists may have a high percentage of tracks without previews. This is a known Spotify limitation.

## End-of-Week Deliverables

- Prisma schema updated with a `Track` model
- FastAPI receives the Spotify access token, fetches the track list, saves tracks to the database
- FastAPI downloads 30-second preview audio for each track that has one
- CLAP model loaded and running in FastAPI
- Embeddings stored in the `Track` table in Postgres
- Full pipeline runs end-to-end when you click "Split this playlist"

## Branch Workflow (every day)

1. `git checkout main && git pull`
2. `git checkout -b <branch-name>`
3. Do the work, commit on the branch
4. `git push -u origin <branch-name>`
5. Open PR on GitHub, review your own diff, merge, delete branch on GitHub
6. Locally: `git checkout main && git pull && git branch -d <branch-name>`

---

## Day 1 — Update Prisma schema with Track model (~1 hr)

**Branch:** `chore/track-schema`

1. Add a `Track` model to `frontend/prisma/schema.prisma`:
   - `id` — auto-generated cuid
   - `jobId` — foreign key linking this track to a `Job`
   - `job` — the relation field
   - `spotifyId` — the Spotify track ID (e.g. `"4iV5W9uYEdYUVa79Axb7Rh"`)
   - `name` — track name
   - `artist` — artist name
   - `previewUrl` — the 30-second MP3 URL from Spotify (nullable — not all tracks have one)
   - `embedding` — the CLAP embedding vector stored as JSON (nullable until computed)
   - `createdAt` — auto timestamp
2. Add a `tracks Track[]` relation to the `Job` model.
3. Ask Claude Code to write the schema — then run `npx prisma db push` and `npx prisma generate`.
4. **Concept:** The `embedding` field is typed as `Json` in Prisma. Underneath it's a Postgres `jsonb` column. We'll store the 512 floats as a JSON array (e.g. `[0.12, -0.34, ...]`). When we read it back in Python for clustering, we convert it back to a numpy array.
5. Commit, PR, merge, cleanup.

---

## Day 2 — FastAPI fetches tracks from Spotify and saves to DB (~2 hrs)

**Branch:** `feature/fetch-tracks`

1. The Next.js `/api/jobs` route already calls FastAPI's `/split`. Update it to also pass `spotify_access_token` in the request body (it's available from `session.spotifyAccessToken`).
2. Install `psycopg2-binary` in the backend: `uv add psycopg2-binary` (or `pip install psycopg2-binary`).
3. In FastAPI's `models.py`, add `spotify_access_token: str` to `SplitRequest`.
4. In FastAPI's `main.py`, update the `/split` endpoint to:
   - Use the access token to call `https://api.spotify.com/v1/playlists/{playlist_id}/items` (paginate through all tracks)
   - For each track that has a `preview_url`, insert a `Track` row into the database using psycopg2
   - Skip tracks where `item` is `null` (podcast episodes / local files)
5. Make sure `DATABASE_URL` is in `backend/.env` (same Supabase session pooler URL as the frontend).
6. **Concept:** FastAPI is now a Spotify API client too — it uses the user's access token (passed from Next.js) to read the playlist on their behalf.
7. Commit, PR, merge, cleanup.

---

## Day 3 — Download audio previews (~1.5 hrs)

**Branch:** `feature/download-audio`

1. For each track in the database (for this job) that has a `previewUrl`, download the 30-second MP3 to a temp directory (`/tmp/audio/{job_id}/{track_id}.mp3`).
2. Use Python's `httpx` (already installed) to download the files.
3. Write a helper function `download_previews(job_id, tracks)` in a new file `backend/app/audio.py`.
4. Call this from the `/split` endpoint after saving tracks to the database.
5. **Concept:** We're downloading the audio locally because CLAP needs to read the audio data from a file. In production you'd use cloud storage, but for now local temp files are fine.
6. Commit, PR, merge, cleanup.

---

## Day 4 — Load CLAP and embed one track (~2 hrs)

**Branch:** `feature/clap-embeddings`

1. The CLAP model is already installed (it came with `transformers` and `torch`). The model name is `laion/clap-htsat-unfused`.
2. Write a new file `backend/app/embeddings.py`. Ask Claude Code to write the skeleton, then fill in the core yourself with guidance:
   - Load the processor and model from Hugging Face
   - Write a function `embed_audio(file_path: str) -> list[float]` that:
     1. Loads the audio file with `librosa`
     2. Runs it through the CLAP processor to get input tensors
     3. Passes the tensors through the model to get the audio embedding
     4. Returns the embedding as a plain Python list of floats
3. Test it manually in a Python shell — load one downloaded preview and get back a list of 512 floats.
4. **Concept:** The processor converts raw audio (a numpy array of samples) into the tensor format CLAP expects. The model then runs those tensors through a neural network and outputs a 512-dimensional embedding. You don't need to understand every layer — just know that similar-sounding audio comes out as similar vectors.
5. Commit on this branch (don't merge yet — Day 5 continues here).

---

## Day 5 — Run embeddings on all tracks and store in DB (~1.5 hrs)

**Branch:** `feature/clap-embeddings` (same branch as Day 4)

1. In `embeddings.py`, write a function `embed_all_tracks(job_id, tracks)` that loops through all downloaded audio files, calls `embed_audio()` on each, and stores the result back to the database (`UPDATE track SET embedding = ... WHERE id = ...`).
2. Call this from the `/split` endpoint after downloading the previews.
3. Verify in Supabase Table Editor that Track rows have non-null `embedding` columns.
4. Commit, PR, merge, cleanup.

---

## Day 6 — End-to-end test (~1 hr)

**Branch:** `feature/pipeline-e2e-test`

1. Click "Split this playlist" in the browser with both servers running.
2. Watch the FastAPI terminal logs — you should see it fetching tracks, downloading audio, and running embeddings.
3. Check Supabase Table Editor — verify that Track rows exist with embeddings stored.
4. This will be slow for large playlists (CLAP is not fast on CPU). That's expected — optimization comes later.
5. If anything breaks, debug and fix.
6. Commit, PR, merge, cleanup.

---

## Day 7 — Wrap up + plan Week 6 (~30-60 min)

**Branch:** `chore/week-5-wrapup`

1. Confirm Days 1-6 are merged into `main`.
2. Update `CLAUDE.md`: mark Week 5 complete, add Week 5 retrospective.
3. Commit, PR, merge, cleanup.
4. Come back to chat to plan Week 6 (finish any remaining pipeline work, HDBSCAN clustering begins).

---

## If You Get Stuck

- Spotify API returns `preview_url: null` for most tracks → this is normal. If a whole playlist has no previews, try a different playlist.
- CLAP model download is slow the first time → Hugging Face caches it locally after the first download (~1GB).
- `librosa` audio loading errors → make sure `ffmpeg` is installed on your machine (`brew install ffmpeg`).
- psycopg2 connection issues → same session pooler URL fix as before.