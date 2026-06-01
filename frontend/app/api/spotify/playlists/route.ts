import { auth } from "@/auth";
import { NextResponse } from "next/server";

type SpotifyPlaylistItem = {
  id: string;
  name: string;
  images: { url: string }[];
  items: { total: number } | null;
};

export async function GET() {
  const session = await auth();

  if (!session?.spotifyAccessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const authHeader = { Authorization: `Bearer ${session.spotifyAccessToken}` };

  // Fetch all pages of playlists. Spotify returns up to 50 per page and
  // includes a `next` URL for the next page, or null when there are no more.
  const allItems: SpotifyPlaylistItem[] = [];
  let url: string | null = "https://api.spotify.com/v1/me/playlists?limit=50";

  while (url) {
    const response: Response = await fetch(url, { headers: authHeader });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Spotify API error", status: response.status },
        { status: 502 }
      );
    }

    const data: { items: SpotifyPlaylistItem[]; next: string | null } = await response.json();
    allItems.push(...data.items);
    url = data.next;
  }

  const playlists = allItems.map((p) => ({
    id: p.id,
    name: p.name,
    imageUrl: p.images[0]?.url ?? null,
    trackCount: p.items?.total ?? 0,
  }));

  return NextResponse.json({ total: playlists.length, playlists });
}