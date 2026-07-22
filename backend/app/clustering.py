import json
import os

import hdbscan
import numpy as np
import psycopg2
from dotenv import load_dotenv

load_dotenv()


def cluster_tracks(job_id: str) -> dict:
    """Load embeddings for a job and run HDBSCAN. Returns {track_id: cluster_label}."""
    database_url = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(database_url)

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, embedding
                FROM "Track"
                WHERE "jobId" = %s AND embedding IS NOT NULL
                """,
                (job_id,),
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    if not rows:
        print("No embeddings found for this job — skipping clustering")
        return {}

    track_ids = [row[0] for row in rows]
    matrix = np.array([json.loads(row[1]) if isinstance(row[1], str) else row[1] for row in rows])

    print(f"Clustering {len(track_ids)} tracks...")
    clusterer = hdbscan.HDBSCAN(min_cluster_size=3, min_samples=1)
    labels = clusterer.fit_predict(matrix)

    n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
    n_noise = list(labels).count(-1)
    print(f"Found {n_clusters} clusters, {n_noise} noise tracks")

    return dict(zip(track_ids, labels.tolist()))


def save_cluster_labels(labels: dict) -> None:
    """Write cluster labels back to the Track table."""
    if not labels:
        return

    database_url = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            for track_id, cluster_id in labels.items():
                cur.execute(
                    'UPDATE "Track" SET "clusterId" = %s WHERE id = %s',
                    (cluster_id, track_id),
                )
        conn.commit()
    finally:
        conn.close()


def run_clustering(job_id: str) -> None:
    labels = cluster_tracks(job_id)
    save_cluster_labels(labels)
