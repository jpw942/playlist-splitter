import os

import httpx
import psycopg2
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import SplitRequest, SplitResponse

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/split", response_model=SplitResponse)
def split(body: SplitRequest):
    tracks = _fetch_spotify_tracks(body.playlist_id, body.spotify_access_token)
    with_preview = [t for t in tracks if t["preview_url"]]
    print(f"Fetched {len(tracks)} tracks, {len(with_preview)} have a preview URL")
    _save_tracks(body.job_id, tracks)
    return SplitResponse(message="received", job_id=body.job_id)


def _fetch_spotify_tracks(playlist_id: str, access_token: str) -> list[dict]:
    """Fetch all tracks for a playlist, paginating through all pages."""
    url = f"https://api.spotify.com/v1/playlists/{playlist_id}/items"
    headers = {"Authorization": f"Bearer {access_token}"}
    tracks = []

    while url:
        with httpx.Client() as client:
            res = client.get(url, headers=headers)
            res.raise_for_status()
            data = res.json()

        for item in data.get("items", []):
            track = item.get("item")
            if track is None:
                continue
            tracks.append({
                "spotify_id": track["id"],
                "name": track["name"],
                "artist": track["artists"][0]["name"] if track.get("artists") else "",
                "preview_url": track.get("preview_url"),
            })

        url = data.get("next")

    return tracks


def _save_tracks(job_id: str, tracks: list[dict]):
    """Insert Track rows into the database for tracks that have a preview URL."""
    database_url = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            for track in tracks:
                if not track["preview_url"]:
                    continue
                cur.execute(
                    """
                    INSERT INTO "Track" ("id", "jobId", "spotifyId", "name", "artist", "previewUrl", "createdAt")
                    VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s, NOW())
                    """,
                    (
                        job_id,
                        track["spotify_id"],
                        track["name"],
                        track["artist"],
                        track["preview_url"],
                    ),
                )
        conn.commit()
    finally:
        conn.close()