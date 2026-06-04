"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { handleSignIn } from "./actions";

type Playlist = {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
};

type Track = {
  name: string;
  artist: string;
  album: string;
  imageUrl: string | null;
};

export default function Home() {
  const { data: session, status } = useSession();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    setPlaylistsLoading(true);
    fetch("/api/spotify/playlists")
      .then((res) => res.json())
      .then((data) => setPlaylists(data.playlists ?? []))
      .finally(() => setPlaylistsLoading(false));
  }, [status]);

  function handleSelectPlaylist(playlist: Playlist) {
    setSelectedPlaylist(playlist);
    setTracks([]);
    setTracksLoading(true);
    fetch(`/api/spotify/playlists/${playlist.id}/tracks`)
      .then((res) => res.json())
      .then((data) => setTracks(data.tracks ?? []))
      .finally(() => setTracksLoading(false));
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        {/* top bar */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
          <h1 className="text-xl font-semibold">Playlist Splitter</h1>
          <div className="flex items-center gap-3">
            {session.user?.image && (
              <img
                src={session.user.image}
                alt="Profile picture"
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm text-gray-300">{session.user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "http://127.0.0.1:3000" })}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* track list view */}
          {selectedPlaylist ? (
            <>
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setSelectedPlaylist(null)}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  ← Back
                </button>
                <h2 className="text-lg font-medium">{selectedPlaylist.name}</h2>
              </div>

              {tracksLoading && (
                <p className="text-gray-400">Loading tracks...</p>
              )}

              {!tracksLoading && tracks.length === 0 && (
                <p className="text-gray-400">No tracks found.</p>
              )}

              {!tracksLoading && tracks.length > 0 && (
                <div className="flex flex-col gap-2">
                  {tracks.map((track, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-900 transition-colors"
                    >
                      {track.imageUrl ? (
                        <img
                          src={track.imageUrl}
                          alt={track.album}
                          className="w-10 h-10 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-700 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{track.name}</p>
                        <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* playlist grid view */
            <>
              <h2 className="text-lg font-medium mb-4">Your Playlists</h2>

              {playlistsLoading && (
                <p className="text-gray-400">Loading playlists...</p>
              )}

              {!playlistsLoading && playlists.length === 0 && (
                <p className="text-gray-400">No playlists found.</p>
              )}

              {!playlistsLoading && playlists.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      onClick={() => handleSelectPlaylist(playlist)}
                      className="bg-gray-900 rounded-lg p-3 hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      {playlist.imageUrl ? (
                        <img
                          src={playlist.imageUrl}
                          alt={playlist.name}
                          className="w-full aspect-square object-cover rounded-md mb-3"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-gray-700 rounded-md mb-3 flex items-center justify-center">
                          <span className="text-gray-500 text-2xl">♪</span>
                        </div>
                      )}
                      <p className="text-sm font-medium truncate">{playlist.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{playlist.trackCount} tracks</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-950 text-white">
      <h1 className="text-2xl font-semibold">Playlist Splitter</h1>
      <form action={handleSignIn}>
        <button
          type="submit"
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          Sign in with Spotify
        </button>
      </form>
    </div>
  );
}