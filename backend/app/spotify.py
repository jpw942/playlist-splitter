import os

import httpx
import psycopg2
from dotenv import load_dotenv

load_dotenv()


def create_cluster_playlists(job_id: str, access_token: str) -> None:
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}

    with httpx.Client() as client:
        user_id = _get_user_id(client, headers)
        clusters = _fetch_clusters(job_id)

        for cluster_number, cluster_name, cluster_db_id in clusters:
            track_uris = _fetch_track_uris(job_id, cluster_number)
            if not track_uris:
                continue

            playlist_id = _create_playlist(client, headers, user_id, cluster_name)
            _add_tracks(client, headers, playlist_id, track_uris)
            _save_playlist_id(cluster_db_id, playlist_id)
            print(f"Created playlist '{cluster_name}' with {len(track_uris)} tracks")

    _mark_job_done(job_id)


def _get_user_id(client: httpx.Client, headers: dict) -> str:
    res = client.get("https://api.spotify.com/v1/me", headers=headers)
    res.raise_for_status()
    return res.json()["id"]


def _fetch_clusters(job_id: str) -> list[tuple]:
    database_url = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT "clusterNumber", "name", "id" FROM "Cluster" WHERE "jobId" = %s',
                (job_id,),
            )
            return cur.fetchall()
    finally:
        conn.close()


def _fetch_track_uris(job_id: str, cluster_number: int) -> list[str]:
    database_url = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT "spotifyId" FROM "Track" WHERE "jobId" = %s AND "clusterId" = %s',
                (job_id, cluster_number),
            )
            rows = cur.fetchall()
    finally:
        conn.close()
    return [f"spotify:track:{row[0]}" for row in rows]


def _create_playlist(client: httpx.Client, headers: dict, user_id: str, name: str) -> str:
    res = client.post(
        f"https://api.spotify.com/v1/users/{user_id}/playlists",
        headers=headers,
        json={"name": name, "public": False, "description": "Created by Playlist Splitter"},
    )
    res.raise_for_status()
    return res.json()["id"]


def _add_tracks(client: httpx.Client, headers: dict, playlist_id: str, uris: list[str]) -> None:
    for i in range(0, len(uris), 100):
        batch = uris[i:i + 100]
        res = client.post(
            f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks",
            headers=headers,
            json={"uris": batch},
        )
        res.raise_for_status()


def _save_playlist_id(cluster_db_id: str, playlist_id: str) -> None:
    database_url = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE "Cluster" SET "spotifyPlaylistId" = %s WHERE id = %s',
                (playlist_id, cluster_db_id),
            )
        conn.commit()
    finally:
        conn.close()


def _mark_job_done(job_id: str) -> None:
    database_url = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE "Job" SET status = \'DONE\' WHERE id = %s',
                (job_id,),
            )
        conn.commit()
    finally:
        conn.close()
