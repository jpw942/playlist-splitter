import NextAuth from "next-auth";
import Spotify from "next-auth/providers/spotify";

// the scopes we request from Spotify — these are the permissions the user grants us
const scopes = [
  "user-read-email",          // read the user's email address
  "user-read-private",        // read the user's subscription level and country
  "playlist-read-private",    // read the user's private playlists
  "playlist-modify-private",  // create and edit private playlists
  "playlist-modify-public",   // create and edit public playlists
].join(" ");

export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    Spotify({
      clientId: process.env.AUTH_SPOTIFY_ID,
      clientSecret: process.env.AUTH_SPOTIFY_SECRET,
      // pass the scopes to Spotify so it knows what permissions to ask the user for
      authorization: { params: { scope: scopes } },
    }),
  ],
});