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
  const [playlistsError, setPlaylistsError] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [tracksError, setTracksError] = useState(false);
  const [splitLoading, setSplitLoading] = useState(false);
  const [splitJobId, setSplitJobId] = useState<string | null>(null);

  function loadPlaylists() {
    setPlaylistsLoading(true);
    setPlaylistsError(false);
    fetch("/api/spotify/playlists")
      .then((res) => {
        if (res.status === 401) { signOut({ callbackUrl: "http://127.0.0.1:3000" }); return null; }
        if (!res.ok) throw new Error("Failed to load playlists");
        return res.json();
      })
      .then((data) => { if (data) setPlaylists(data.playlists ?? []); })
      .catch(() => setPlaylistsError(true))
      .finally(() => setPlaylistsLoading(false));
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    loadPlaylists();
  }, [status]);

  async function handleSplit() {
    if (!selectedPlaylist) return;
    setSplitLoading(true);
    setSplitJobId(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistId: selectedPlaylist.id, playlistName: selectedPlaylist.name }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSplitJobId(data.jobId);
    } catch {
      // TODO: show error state in a future day
    } finally {
      setSplitLoading(false);
    }
  }

  function handleSelectPlaylist(playlist: Playlist) {
    setSelectedPlaylist(playlist);
    setTracks([]);
    setTracksError(false);
    setTracksLoading(true);
    setSplitJobId(null);
    fetch(`/api/spotify/playlists/${playlist.id}/tracks`)
      .then((res) => {
        if (res.status === 401) { signOut({ callbackUrl: "http://127.0.0.1:3000" }); return null; }
        if (!res.ok) throw new Error("Failed to load tracks");
        return res.json();
      })
      .then((data) => { if (data) setTracks(data.tracks ?? []); })
      .catch(() => setTracksError(true))
      .finally(() => setTracksLoading(false));
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        {/* top bar */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
          <h1 className="text-xl font-semibold tracking-tight">Playlist Splitter</h1>
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
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="px-8 py-6">
          {selectedPlaylist ? (
            /* track list view */
            <>
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setSelectedPlaylist(null)}
                  className="text-sm text-gray-500 hover:text-white transition-colors shrink-0"
                >
                  ← Back
                </button>
                {selectedPlaylist.imageUrl && (
                  <img
                    src={selectedPlaylist.imageUrl}
                    alt={selectedPlaylist.name}
                    className="w-12 h-12 rounded object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold truncate">{selectedPlaylist.name}</h2>
                  {!tracksLoading && !tracksError && (
                    <p className="text-xs text-gray-500">{tracks.length} tracks</p>
                  )}
                </div>
                <button
                  onClick={handleSplit}
                  disabled={splitLoading}
                  className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-full hover:bg-green-400 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {splitLoading ? "Splitting..." : "Split this playlist"}
                </button>
              </div>

              {splitJobId && (
                <p className="text-sm text-green-400 mb-4">
                  Job created! ID: {splitJobId}
                </p>
              )}

              {tracksLoading && <p className="text-sm text-gray-500">Loading tracks...</p>}

              {tracksError && (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-red-400">Failed to load tracks.</p>
                  <button
                    onClick={() => handleSelectPlaylist(selectedPlaylist)}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!tracksLoading && !tracksError && tracks.length === 0 && (
                <p className="text-sm text-gray-500">No tracks found.</p>
              )}

              {!tracksLoading && !tracksError && tracks.length > 0 && (
                <div className="flex flex-col">
                  {tracks.map((track, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-gray-900 transition-colors"
                    >
                      <span className="w-5 text-right text-xs text-gray-600 shrink-0">
                        {index + 1}
                      </span>
                      {track.imageUrl ? (
                        <img
                          src={track.imageUrl}
                          alt={track.album}
                          className="w-10 h-10 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-800 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{track.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {track.artist} · {track.album}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* playlist grid view */
            <>
              <div className="flex items-baseline gap-3 mb-5">
                <h2 className="text-lg font-semibold">Your Playlists</h2>
                {!playlistsLoading && !playlistsError && playlists.length > 0 && (
                  <span className="text-sm text-gray-500">{playlists.length} playlists</span>
                )}
              </div>

              {playlistsLoading && <p className="text-sm text-gray-500">Loading playlists...</p>}

              {playlistsError && (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-red-400">Failed to load playlists.</p>
                  <button
                    onClick={loadPlaylists}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!playlistsLoading && !playlistsError && playlists.length === 0 && (
                <p className="text-sm text-gray-500">No playlists found.</p>
              )}

              {!playlistsLoading && !playlistsError && playlists.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
                        <div className="w-full aspect-square bg-gray-800 rounded-md mb-3 flex items-center justify-center">
                          <span className="text-gray-600 text-2xl">♪</span>
                        </div>
                      )}
                      <p className="text-sm font-medium truncate">{playlist.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{playlist.trackCount} tracks</p>
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Playlist Splitter</h1>
        <p className="text-gray-400 text-sm">Split your Spotify playlists into smart sub-playlists using AI</p>
      </div>
      <form action={handleSignIn}>
        <button
          type="submit"
          className="px-6 py-3 bg-green-500 text-white text-sm font-medium rounded-full hover:bg-green-400 transition-colors"
        >
          Sign in with Spotify
        </button>
      </form>
    </div>
  );
}