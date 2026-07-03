import os

import httpx
import psycopg2
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .audio import download_previews
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
def split(body: SplitRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(_process_split, body.job_id, body.playlist_id, body.spotify_access_token)
    return SplitResponse(message="received", job_id=body.job_id)


def _process_split(job_id: str, playlist_id: str, access_token: str):
    tracks = _fetch_spotify_tracks(playlist_id, access_token)
    _save_tracks(job_id, tracks)
    download_previews(job_id, tracks)


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
    """Insert a Track row for every track in the playlist."""
    database_url = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            for track in tracks:
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