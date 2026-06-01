import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.spotifyAccessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const response = await fetch(
    "https://api.spotify.com/v1/me/playlists?limit=50",
    {
      headers: {
        Authorization: `Bearer ${session.spotifyAccessToken}`,
      },
    }
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Spotify API error", status: response.status },
      { status: 502 }
    );
  }

  const data = await response.json();

  const playlists = data.items.map((p: {
    id: string;
    name: string;
    images: { url: string }[];
    tracks: { total: number };
  }) => ({
    id: p.id,
    name: p.name,
    imageUrl: p.images[0]?.url ?? null,
    trackCount: p.tracks?.total ?? 0,
  }));

  return NextResponse.json({ total: data.total, playlists });
}