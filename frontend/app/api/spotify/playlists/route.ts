import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.spotifyAccessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const response = await fetch(
    "https://api.spotify.com/v1/me/playlists?limit=1",
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
  return NextResponse.json({ total: data.total });
}