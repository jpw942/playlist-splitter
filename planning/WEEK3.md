# Week 3 — Playlist Reading & Basic UI

**Theme:** By end of this week, a logged-in user can see their Spotify playlists, pick one, and browse its tracks — all in a clean, styled UI.

## End-of-Week Deliverables

- `/api/spotify/playlists` returns full playlist data (name, artwork, track count), not just total
- Home page shows a grid/list of the user's playlists with artwork and names
- Clicking a playlist fetches and displays its tracks (title, artist, album art)
- UI is styled with Tailwind — looks like a real app, not a dev prototype
- "Fetch my playlist count" button removed and replaced by the real playlist UI

## Branch Workflow (every day)

1. `git checkout main && git pull`
2. `git checkout -b <branch-name>`
3. Do the work, commit on the branch
4. `git push -u origin <branch-name>`
5. Open PR on GitHub, review your own diff, merge, delete branch on GitHub
6. Locally: `git checkout main && git pull && git branch -d <branch-name>`

---

## Day 1 — Fetch full playlist list from Spotify (~1.5 hrs)

**Branch:** `feature/fetch-playlists`

1. Update `frontend/app/api/spotify/playlists/route.ts` to return the full list instead of just `total`. Each playlist object should include:
   - `id` — needed later to fetch tracks
   - `name`
   - `images[0].url` — the playlist artwork
   - `tracks.total` — number of tracks
2. Spotify's API returns playlists paginated (max 50 per request). For now, just fetch the first page (`limit=50`). We'll handle pagination later if needed.
3. Test by visiting `http://127.0.0.1:3000/api/spotify/playlists` in the browser while logged in — you should see a JSON array of your playlists.
4. Commit, PR, merge, cleanup.

---

## Day 2 — Display playlists in the UI (~1.5 hrs)

**Branch:** `feature/playlist-grid`

1. On the home page (authenticated state), replace the "Fetch my playlist count" button with a playlist grid that loads automatically when you're logged in.
2. Each playlist card should show:
   - Artwork (or a placeholder if no image)
   - Playlist name
   - Track count (e.g. "42 tracks")
3. Use Tailwind to style the grid — aim for a 2- or 3-column card layout.
4. Handle the loading state (while playlists are being fetched) and the empty state (if the user has no playlists).
5. **Concept:** `useEffect` + `fetch` is the standard React pattern for loading data when a component mounts. Claude Code can write this — read it and understand what's happening.
6. Commit, PR, merge, cleanup.

---

## Day 3 — Fetch tracks from a selected playlist (~1.5 hrs)

**Branch:** `feature/fetch-tracks`

1. Create `frontend/app/api/spotify/playlists/[id]/tracks/route.ts` — a new server-side endpoint that:
   - Reads the playlist `id` from the URL
   - Calls `https://api.spotify.com/v1/playlists/{id}/tracks` with the user's access token
   - Returns an array of tracks, each with: `name`, `artists[0].name`, `album.name`, `album.images[0].url`
2. Test by visiting the endpoint directly in the browser with a real playlist ID from Day 1's response.
3. **Concept:** `[id]` in the file path is Next.js dynamic routing — the same pattern as `[...nextauth]` from Week 2, but for a single segment.
4. Commit, PR, merge, cleanup.

---

## Day 4 — Display tracks when a playlist is selected (~1.5 hrs)

**Branch:** `feature/track-list`

1. Make each playlist card clickable. When clicked:
   - Store the selected playlist ID in React state
   - Fetch its tracks from the endpoint you built in Day 3
   - Show a track list below (or instead of) the playlist grid
2. Each track row should show: album art thumbnail, track name, artist name.
3. Add a "back" button or way to deselect and return to the playlist grid.
4. Handle the loading state while tracks are fetching.
5. Commit, PR, merge, cleanup.

---

## Day 5 — UI polish (~1-2 hrs)

**Branch:** `feature/ui-polish`

1. Step back and look at the full page — sign-in screen, playlist grid, and track list.
2. Make it look intentional:
   - Consistent spacing, font sizes, colors
   - Profile picture and name visible while browsing playlists (don't hide them after login)
   - Hover states on clickable cards
   - Sign-out button tucked somewhere tasteful (e.g. top right corner)
3. No new functionality — this day is purely visual cleanup.
4. Commit, PR, merge, cleanup.

---

## Day 6 — Error handling & edge cases (~1 hr)

**Branch:** `feature/error-handling`

1. What happens if the Spotify API call fails? Right now the UI would silently break. Add basic error states:
   - Failed to load playlists → show a message with a retry button
   - Failed to load tracks → show a message
2. What if a playlist has no artwork? Make sure the placeholder looks intentional.
3. What if the access token has expired? For now, just redirect to sign-in if a 401 comes back from the API.
4. Commit, PR, merge, cleanup.

---

## Day 7 — Wrap up + plan Week 4 (~30-60 min)

**Branch:** `chore/week-3-wrapup`

1. Confirm Days 1-6 are merged into `main` on GitHub.
2. Update `CLAUDE.md`: mark Week 3 complete, add a Week 3 Retrospective.
3. Commit, PR, merge, cleanup.
4. Come back to chat to plan Week 4.

---

## If You Get Stuck

- Spotify API docs for playlists: https://developer.spotify.com/documentation/web-api/reference/get-a-list-of-current-users-playlists
- Spotify API docs for tracks: https://developer.spotify.com/documentation/web-api/reference/get-playlists-tracks
- React `useEffect` confusion → ask in chat
- Next.js dynamic routes → ask in chat