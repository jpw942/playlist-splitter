import { auth } from "@/auth";
import { NextResponse } from "next/server";

type SpotifyItem = {
  item: {
    name: string;
    artists: { name: string }[];
    album: {
      name: string;
      images: { url: string }[];
    };
  } | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.spotifyAccessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const authHeader = { Authorization: `Bearer ${session.spotifyAccessToken}` };

  const allItems: SpotifyItem[] = [];
  let url: string | null = `https://api.spotify.com/v1/playlists/${id}/items?limit=50`;

  while (url) {
    const response: Response = await fetch(url, { headers: authHeader });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Spotify API error", status: response.status },
        { status: 502 }
      );
    }

    const data: { items: SpotifyItem[]; next: string | null } = await response.json();
    allItems.push(...(data.items ?? []));
    url = data.next;
  }

  const tracks = allItems
    .filter((entry) => entry.item != null)
    .map((entry) => ({
      name: entry.item!.name,
      artist: entry.item!.artists[0]?.name ?? "Unknown artist",
      album: entry.item!.album?.name ?? "Unknown album",
      imageUrl: entry.item!.album?.images[0]?.url ?? null,
    }));

  return NextResponse.json({ tracks });
}