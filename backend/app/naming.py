import os

import anthropic
import psycopg2
from dotenv import load_dotenv

load_dotenv()

_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


def name_cluster(tracks: list[dict]) -> str:
    """Send a cluster's tracks to Claude and get back a creative playlist name."""
    track_list = "\n".join(f'- "{t["name"]}" by {t["artist"]}' for t in tracks)
    prompt = (
        f"Here are the songs in a Spotify playlist cluster:\n{track_list}\n\n"
        "Give this cluster a short, creative playlist name (2–5 words) that captures the vibe. "
        "Respond with only the name, no explanation, no quotes."
    )
    message = _client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=32,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text.strip().strip('"').strip("'")


def name_all_clusters(job_id: str, tracks: list[dict]) -> dict:
    """Group tracks by clusterId and get an LLM name for each cluster. Returns {cluster_number: name}."""
    database_url = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT id, "spotifyId", "clusterId" FROM "Track" WHERE "jobId" = %s AND "clusterId" IS NOT NULL',
                (job_id,),
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    track_map = {t["spotify_id"]: t for t in tracks}
    clusters: dict[int, list[dict]] = {}
    noise_count = 0
    for row_id, spotify_id, cluster_id in rows:
        if cluster_id == -1:
            noise_count += 1
            continue
        track = track_map.get(spotify_id, {"name": spotify_id, "artist": ""})
        clusters.setdefault(cluster_id, []).append(track)

    cluster_names = {}
    for cluster_number, cluster_tracks in clusters.items():
        print(f"Naming cluster {cluster_number} ({len(cluster_tracks)} tracks)...")
        cluster_names[cluster_number] = name_cluster(cluster_tracks)
        print(f"  → {cluster_names[cluster_number]}")

    if noise_count > 0:
        print(f"Found {noise_count} noise tracks → 'Miscellaneous'")
        cluster_names[-1] = "Miscellaneous"

    return cluster_names


def save_cluster_names(job_id: str, cluster_names: dict) -> None:
    """Insert a Cluster row for each cluster with its LLM-generated name."""
    if not cluster_names:
        return

    database_url = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            for cluster_number, name in cluster_names.items():
                cur.execute(
                    """
                    INSERT INTO "Cluster" ("id", "jobId", "clusterNumber", "name", "createdAt")
                    VALUES (gen_random_uuid()::text, %s, %s, %s, NOW())
                    """,
                    (job_id, cluster_number, name),
                )
        conn.commit()
    finally:
        conn.close()
