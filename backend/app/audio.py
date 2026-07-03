import os

import httpx


def download_previews(job_id: str, tracks: list[dict]) -> None:
    """Download a 30s preview for each track via the Deezer public API."""
    output_dir = f"/tmp/audio/{job_id}"
    os.makedirs(output_dir, exist_ok=True)

    with httpx.Client(timeout=30) as client:
        for track in tracks:
            query = f"{track['artist']} {track['name']}"
            output_path = f"{output_dir}/{track['spotify_id']}.mp3"

            res = client.get(
                "https://api.deezer.com/search",
                params={"q": query, "limit": 1},
            )
            data = res.json()

            if not data.get("data"):
                print(f"Not found on Deezer: {track['name']}")
                continue

            preview_url = data["data"][0].get("preview")
            if not preview_url:
                print(f"No preview available: {track['name']}")
                continue

            audio = client.get(preview_url)
            with open(output_path, "wb") as f:
                f.write(audio.content)

            print(f"Downloaded: {track['artist']} - {track['name']}")
