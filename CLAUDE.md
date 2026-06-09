# CLAUDE.md — playlist-splitter

This file gives Claude Code persistent context about this project. Read it before making suggestions or writing code.

## Project Overview

**Name:** playlist-splitter
**Description:** Splits Spotify playlists into smart sub-playlists by clustering tracks on audio embeddings (CLAP + HDBSCAN).
**Owner:** James Watkins
**Timeline:** ~3 months, working ~15-18 hours/week
**Goal:** A polished portfolio project demonstrating real software engineering and ML skills, suitable for showing to recruiters.

## What the App Does

A web app where a user logs in with their Spotify account, picks an existing playlist, and the app analyzes the audio of each track using ML to cluster songs into musically-similar sub-playlists. The new sub-playlists are written back to the user's Spotify account with LLM-generated names like "Late Night Chill" or "High-Energy Hip-Hop." The original playlist is never modified.

## Tech Stack (locked in)

### Frontend
- **Framework:** Next.js (latest, App Router)
- **Language:** TypeScript (not JavaScript — typed end to end)
- **Auth:** Auth.js (formerly NextAuth) with Spotify provider, OAuth 2.0 + PKCE
- **Styling:** TBD (likely Tailwind CSS, decide in Week 3)

### Backend
- **Web/API layer:** Next.js API routes (for Spotify integration, auth, light app logic)
- **ML service:** Separate Python FastAPI service (handles all ML work)
- **The two services communicate over HTTP**

### ML Pipeline
- **Framework:** PyTorch + Hugging Face `transformers`
- **Audio embedding model:** CLAP (LAION) via Hugging Face
- **Clustering:** HDBSCAN (via the `hdbscan` Python package)
- **Audio handling:** `librosa` or `torchaudio` for loading 30-second Spotify preview clips
- **Cluster naming:** Anthropic Claude API or OpenAI API (small model, e.g. Haiku or gpt-4o-mini), called from the FastAPI service

### Database
- **Database:** PostgreSQL hosted on Supabase
- **ORM:** TBD (likely Prisma for the Next.js side, SQLAlchemy or `psycopg` for the Python side — decide in Week 2)

### Hosting (planned)
- **Frontend:** Vercel (free tier)
- **Python ML backend:** Render, Railway, or Fly.io (free tier during dev, ~$5-10/month for always-on during demo phase)
- **Database:** Supabase (free tier)
- **Domain:** Custom .com domain (~$12/year)

### Dev Tooling
- **OS:** macOS
- **Editor:** VS Code
- **Version control:** Git + GitHub (public repo)
- **Python deps:** Use `uv` for speed (preferred over pip)
- **Secrets:** `.env` files, never committed

## Architecture (high-level)

```
[User Browser]
      ↓
[Next.js Frontend on Vercel] ← TypeScript, Auth.js, UI
      ↓
[Next.js API Routes] ← OAuth callbacks, Spotify API calls, light coordination
      ↓                              ↓
[Supabase Postgres]      [Python FastAPI on Render]
                             ↓
                       [CLAP embeddings + HDBSCAN clustering + LLM naming]
                             ↓
                       [Spotify API: create new playlists]
```

## Key Design Decisions and Why

- **Hybrid architecture (Next.js + Python):** ML libraries are Python-native. Trying to do ML in Node is painful. The hybrid mirrors real industry architectures.
- **CLAP over MERT:** CLAP has better Hugging Face docs and a gentler learning curve. MERT might give better music-specific results but the docs are rougher. James has no prior ML experience, so easier docs win for v1.
- **HDBSCAN over KMeans:** Different playlists have different numbers of natural genre groupings. HDBSCAN figures out cluster count automatically and handles outliers (songs that don't fit any cluster).
- **LLM cluster naming:** Pennies per playlist; transforms the product feel from "Cluster 3" to "Late-Night R&B." Worth it.
- **Spotify-only for v1:** Cross-platform matching (Spotify ↔ Apple Music) is a rabbit hole. Get Spotify excellent first; Apple Music is a stretch goal for the buffer week if everything else is done.
- **Development Mode auth:** Spotify apps start limited to 25 manually-allowlisted users. Fine for portfolio/demo. Public launch (Extension Mode) requires Spotify review and is not part of v1.

## Things to NOT Suggest

- Don't suggest switching frameworks (no Vue, no Flask, no JS-based ML, etc.). Stack is locked.
- Don't suggest training a custom model. We use pretrained CLAP only.
- Don't suggest adding Apple Music, YouTube Music, or local libraries to v1. Stretch goal only.
- Don't suggest using Spotify's audio-features endpoint — it was deprecated for new apps in late 2024.
- Don't suggest skipping TypeScript or skipping tests "for speed." Quality matters for the portfolio.
- Don't suggest storing secrets in code. Always env vars.
- Don't suggest removing the separate Python service in favor of doing ML in Node.

## Learning Context

I have solid CS fundamentals (3rd year CSE) but have never done ML before. When introducing ML concepts:
- Explain *what* the code does and *why*, not just how to write it.
- For boilerplate (auth setup, config), full code is fine.
- For ML pipeline pieces, encourage me to write the core myself with guidance — I needs to be able to explain this in interviews.
- Flag unfamiliar concepts (embeddings, clustering, loss, etc.) and explain them on first use.

## Sprint Plan (3 months, 12 weeks)

**Month 1: Foundations + Spotify Integration**
- Week 1: ML fundamentals + project scaffolding
- Week 2: Finish ML basics, Next.js + Auth.js setup, FastAPI hello world
- Weeks 3-4: Full Spotify OAuth + playlist reading + basic UI

**Month 2: ML Pipeline**
- Weeks 5-6: Audio download → CLAP embeddings → store in Postgres
- Week 7: HDBSCAN clustering + parameter tuning
- Week 8: Write back to Spotify + LLM cluster naming → end-to-end working

**Month 3: Polish + Deploy**
- Week 9: UI/UX polish, error handling, loading states
- Week 10: Deploy everything, custom domain, multi-account testing
- Week 11: Edge cases, stress testing, README
- Week 12: Buffer week / stretch goals

## Current Sprint

**Status:** Week 3 complete
**Next:** Week 4 — TBD (plan in chat)

## Week 1 Retrospective

**What went smoothly:**
I think I understood all of the topics extremely well and how they work. I understand the concept of embedding and how a vector of numerical values can help a machine to compare two different pieces of data. I also understand how the frontend and backend work with each other. At first, no HTTP calls were allowed, so the two servers were unable to interact with each other (they did not know the other existed). However, after adding CORS middleware on the backend to specifically allow the frontend's origin, the two programs were able to fully interact with each other. 

**What was slow:**
Understanding CORS middleware and understanding the code behind it took a little bit of time. However, there were no topics covered in week one that I was unable to grasp, and I think that I am going at a good pace. Although, I would also like to add that the Jupyter notebook was a little confusing for me, so I may need a refresher on that. 

**Anything unexpected:**
Nothing really unexpected so far, I have learned about a few of the topics so far loosely in some of my classes at school (such as embedding and HTTP calls), so everything I have learned so far is going pretty well. 

## Week 2 Retrospective

**What went smoothly:**
Days 1 through 3 went pretty smoothly overall. Getting the developer credentials from Spotify and putting them into `.env.local` was straightforward, and installing Auth.js and writing `auth.ts` with the Spotify provider and scopes didn't give me much trouble either. Day 3 also went well — wiring up the catch-all route handler that processes the OAuth callback, and wrapping the app in `<SessionProvider>` so `useSession()` works anywhere in the app. Day 6 also went well. Understanding the idea behind keeping the access token server-side — the browser calls our backend, our backend calls Spotify, and the browser only ever gets back the data it asked for — clicked pretty naturally.

**What was slow:**
Day 4 is where things got tricky. While adding the sign-in button itself went fine, I didn't realize I needed Spotify Premium to use the Web API. This meant that sometimes the Spotify agreement screen wouldn't even appear, and when it did, clicking "Agree" still threw an error. There were also persistent issues with redirect URLs — Spotify's developer dashboard doesn't allow `localhost` as a redirect URI, but Next.js internally normalizes `127.0.0.1` to `localhost`, so after signing in and out I'd end up on `localhost`, which caused the next sign-in attempt to fail. Fixing this required several pieces working together: binding the dev server to `127.0.0.1` with `-H 127.0.0.1`, a `proxy.ts` file that sets the correct host header on all auth requests, using a server action for sign-in (so Auth.js reads `AUTH_URL` directly instead of the normalized URL), and a custom `redirect` callback in `auth.ts` that forces all post-login redirects back to `127.0.0.1`. Day 5 had similar redirect issues, though once those were resolved, reading and displaying the user's profile info (name, email, profile picture) from the session using `useSession()` was fairly straightforward.

**Anything unexpected:**
The biggest surprise was how many moving parts were involved in keeping `127.0.0.1` consistent end-to-end. It wasn't one bug — it was a chain of four or five places where Next.js or Auth.js would quietly rewrite the URL back to `localhost`, each requiring a separate fix. Also didn't expect that Spotify Premium would be a requirement for the Web API, which caused confusion early on in Day 4.

## Week 3 Retrospective

**What went smoothly:**
Day 1 went well. I didn't have much trouble fetching the attributes of each playlist, which included the playlist ID, name, artwork, and track count. I also understood what was going on in the background — the server makes a request to Spotify's API to retrieve this information, which is then passed to the browser and displayed in the UI. Day 2 was also pretty simple, just taking the JSON data from Day 1 and converting it into a more user-friendly layout (improving the UI with a grid of playlist cards). Day 3 was similar to Day 1 in the sense that it produced a JSON response consisting of the tracks in a selected playlist, also using a server-side API call to retrieve this information. Day 4 was just displaying each track using the attributes received in Day 3 (name, artist, album, image). Day 5 polished the UI to make it look more presentable and professional — rounding buttons, adjusting font colors and sizes, adding a track count to the playlist header, and showing album art when viewing a playlist's tracks. Day 6 focused on error handling, making sure that if a Spotify API call fails the UI doesn't silently break. A retry button was added when playlists fail to load, and an error message appears when tracks fail to load. React state was crucial here — we declared `playlistsError` and `tracksError` booleans to track whether we're in an error state and conditionally render the right UI.

**What was slow:**
The biggest source of friction this week was Spotify's API field naming. Spotify recently renamed several fields to accommodate podcasts alongside regular music — `tracks` became `items` in the playlist list response, the track count moved from `p.tracks.total` to `p.items.total`, the `/tracks` endpoint became `/items`, and the nested track object inside each item changed from `item.track` to `item.item`. None of this is documented clearly, so each one had to be discovered through debugging with console logs. Day 3 also had a 403 error initially because we were calling the old `/tracks` endpoint, which Spotify has restricted for new apps.

**Anything unexpected:**
The Spotify API renames were the biggest surprise — the same root cause showed up four separate times across different days. Also discovered that some playlists (those containing local files added from a computer) return `item: null` for every track, so they show as empty in the app. This is a Spotify limitation since local files aren't accessible via the API.

## Update Protocol

This file should be updated weekly with:
- Current sprint status
- Completed milestones
- New decisions made
- Anything Claude Code should know that has changed

If myself or Claude Code make a stack/architecture decision mid-project, update the relevant section here so future Claude Code sessions don't suggest reverting it.