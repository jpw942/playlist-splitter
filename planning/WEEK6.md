# Week 6 — HDBSCAN Clustering

**Theme:** The embeddings are in the database — now we turn them into clusters. By end of this week, the FastAPI service reads the CLAP embeddings for a job, runs HDBSCAN to group similar-sounding tracks together, and writes the cluster assignments back to the database. This is the step that makes the whole product idea real: songs that sound alike end up in the same group.

We're a week ahead of the original schedule. HDBSCAN was originally planned for Week 7, so use any extra time for parameter tuning and making sure the clusters actually make musical sense.

## Background: What is HDBSCAN?

HDBSCAN (Hierarchical Density-Based Spatial Clustering of Applications with Noise) is a clustering algorithm that groups points in a high-dimensional space based on how densely packed they are. Unlike KMeans, you don't tell it how many clusters to find — it figures that out automatically. It also has a concept of "noise": tracks that don't sound like any other track in the playlist get assigned to cluster `-1` instead of being forced into a group they don't belong to.

For this project, each track is a point in 512-dimensional space (its CLAP embedding). HDBSCAN will find groups of tracks whose embeddings are close together — which, because of how CLAP was trained, means they sound similar.

**Key parameters:**
- `min_cluster_size`: the minimum number of tracks to form a cluster. Too small → too many tiny clusters. Too large → everything gets lumped together or marked as noise. A good starting point for a typical playlist is 3.
- `min_samples`: controls how conservative the algorithm is. Higher values → more tracks marked as noise. Start with 1 or 2.

## End-of-Week Deliverables

- Prisma schema updated with a `clusterId` field on `Track`
- FastAPI loads embeddings from the DB and runs HDBSCAN
- Cluster labels stored back to the `Track` table
- Noise tracks (cluster `-1`) handled gracefully
- Full pipeline runs end-to-end: click "Split" → tracks clustered → cluster IDs in DB
- Clusters make rough musical sense when inspected manually

## Branch Workflow (every day)

1. `git checkout main && git pull`
2. `git checkout -b <branch-name>`
3. Do the work, commit on the branch
4. `git push -u origin <branch-name>`
5. Open PR on GitHub, review your own diff, merge, delete branch on GitHub
6. Locally: `git checkout main && git pull && git branch -d <branch-name>`

---

## Day 1 — Update Prisma schema with clusterId (~30 min)

**Branch:** `chore/cluster-schema`

1. Add a `clusterId` field to the `Track` model in `frontend/prisma/schema.prisma`:
   - `clusterId Int?` — nullable integer. Null until clustering runs. -1 means noise (HDBSCAN's label for tracks that don't fit any cluster).
2. Run `npx prisma db push` and `npx prisma generate`.
3. **Concept:** We store the cluster label as a plain integer. HDBSCAN outputs 0, 1, 2, ... for real clusters and -1 for noise. Later, when we name the clusters with an LLM, we'll add a separate `Cluster` table — for now the integer is enough.
4. Commit, PR, merge, cleanup.

---

## Day 2 — Write the clustering function (~2 hrs)

**Branch:** `feature/hdbscan-clustering`

1. Install `hdbscan` in the backend: `uv add hdbscan`.
2. Create a new file `backend/app/clustering.py`. Write a function `cluster_tracks(job_id: str) -> dict`:
   - Connect to the DB with psycopg2
   - Fetch all Track rows for this job where `embedding IS NOT NULL`
   - Convert the embeddings to a 2D numpy array (shape: `[n_tracks, 512]`)
   - Run HDBSCAN: `hdbscan.HDBSCAN(min_cluster_size=3, min_samples=1).fit(matrix)`
   - Return a dict mapping `track_id → cluster_label`
3. **Concept:** The numpy matrix is the key data structure here. Each row is one track's 512-float embedding. HDBSCAN reads all the rows at once and figures out which rows (tracks) are near each other in that 512-dimensional space.
4. Commit on this branch (don't merge yet — Day 3 continues here).

---

## Day 3 — Store cluster labels and wire into pipeline (~1.5 hrs)

**Branch:** `feature/hdbscan-clustering` (same branch as Day 2)

1. In `clustering.py`, add a function `save_cluster_labels(job_id: str, labels: dict)` that UPDATEs each Track row with its cluster label.
2. Combine into a single `run_clustering(job_id: str)` function that calls both.
3. In `main.py`, import `run_clustering` and call it from `_process_split` after `embed_all_tracks`.
4. **Concept:** The pipeline now has four stages: fetch → save → download → embed → cluster. Each stage feeds into the next.
5. Commit, PR, merge, cleanup.

---

## Day 4 — Parameter tuning (~1.5 hrs)

**Branch:** `feature/cluster-tuning`

1. Click "Split this playlist" with a playlist you know well (varied genres work best).
2. Check Supabase — look at which tracks share a `clusterId`. Do the groupings make musical sense?
3. Try adjusting `min_cluster_size` (try 2, 3, 5) and `min_samples` (try 1, 2, 3). Re-run the pipeline after each change and observe how the clusters shift.
4. Pick values that give meaningful groups without too much noise (too many -1s).
5. **Concept:** There's no single "right" answer for these parameters — it depends on the playlist. For the demo, pick values that work well on a medium-sized playlist (30-80 tracks with varied genres).
6. Commit the chosen parameters, PR, merge, cleanup.

---

## Day 5 — Handle noise and edge cases (~1 hr)

**Branch:** `feature/cluster-edge-cases`

1. Decide what to do with noise tracks (cluster `-1`). Two options:
   - **Option A:** Leave them as -1 in the DB and exclude them from the final sub-playlists.
   - **Option B:** Assign each noise track to the nearest cluster using cosine similarity.
   - For now, Option A is fine — just make sure the downstream code handles -1 gracefully.
2. Handle the edge case where HDBSCAN finds only 1 cluster or no clusters at all (e.g. a very short playlist). Log a warning and continue — don't crash.
3. Handle the edge case where a job has no tracks with embeddings (all Deezer lookups failed). Log and skip clustering.
4. Commit, PR, merge, cleanup.

---

## Day 6 — End-to-end test (~1 hr)

**Branch:** `feature/cluster-e2e-test`

1. Run the full pipeline from the browser with a playlist of 30+ tracks spanning multiple genres.
2. In Supabase, inspect the `clusterId` column. Group by `clusterId` and look at the track names — do the groupings make rough musical sense? (They don't have to be perfect, just meaningful.)
3. Note how many clusters HDBSCAN found and what percentage of tracks are noise (-1).
4. If the clusters look completely wrong, revisit the parameters from Day 4.
5. Commit, PR, merge, cleanup.

---

## Day 7 — Wrap up + plan Week 7 (~30-60 min)

**Branch:** `chore/week-6-wrapup`

1. Confirm Days 1-6 are merged into `main`.
2. Update `CLAUDE.md`: mark Week 6 complete, add Week 6 retrospective.
3. Commit, PR, merge, cleanup.
4. Come back to chat to plan Week 7 (LLM cluster naming + writing sub-playlists back to Spotify).

---

## If You Get Stuck

- HDBSCAN finds 0 or 1 clusters → try lowering `min_cluster_size` (try 2). The playlist may not have enough variety, or not enough tracks.
- Everything is noise (-1) → try lowering `min_samples` to 1.
- `hdbscan` install fails → try `uv add hdbscan --no-build-isolation` or install via pip in the venv.
- Embeddings loading slowly → make sure you're only fetching rows where `embedding IS NOT NULL`.