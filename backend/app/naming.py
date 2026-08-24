import os

import anthropic
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
