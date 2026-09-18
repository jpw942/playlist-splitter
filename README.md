# Playlist Splitter

A web app that splits your Spotify playlists into smart sub-playlists using AI. It analyzes the audio of each track using machine learning to cluster songs by genre and musical style, then creates the new playlists directly in your Spotify account with AI-generated names like "Late Night R&B" or "High-Energy Hip-Hop."

## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS, Auth.js (Spotify OAuth)
- **Backend:** Python, FastAPI
- **ML Pipeline:** PyTorch, Hugging Face Transformers, CLAP audio embeddings, HDBSCAN clustering
- **LLM Naming:** Anthropic Claude API (claude-haiku)
- **Database:** PostgreSQL (Supabase)
- **Hosting:** Vercel (frontend)

## Architecture

```
[User Browser]
      ↓
[Next.js on Vercel] ← Auth.js, Spotify API, UI
      ↓
[Next.js API Routes]
      ↓                    ↓
[Supabase Postgres]   [Python FastAPI]
                           ↓
                  [CLAP embeddings + HDBSCAN + Claude API]
                           ↓
                  [Spotify API: create new playlists]
```

## How It Works

1. User logs in with their Spotify account
2. Picks a playlist to split
3. The backend downloads 30-second audio previews for each track via the Deezer API
4. Each track is embedded using the CLAP audio model (LAION)
5. HDBSCAN clusters the embeddings into musically similar groups
6. Claude names each cluster based on the tracks in it
7. New playlists are written back to the user's Spotify account

## Running Locally

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
uv run uvicorn app.main:app --reload
```

Requires `.env.local` (frontend) and `.env` (backend) — see each directory for required variables.

## Live Demo

[playlist-splitter-sigma.vercel.app](https://playlist-splitter-sigma.vercel.app) — auth and playlist browsing work on the live site; the ML split requires the Python backend running locally.
