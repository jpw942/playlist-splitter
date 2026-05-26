// imports the server-side signIn function from our auth config
import { signIn } from "@/auth";

// a server action — runs on the server when the form is submitted
// "use server" tells Next.js this function runs server-side, not in the browser
async function handleSignIn() {
  "use server";
  await signIn("spotify");
}

// this page is now a server component (no "use client") — the button uses a form + server action
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-semibold">Playlist Splitter</h1>
      {/* form submits to the server action, which redirects the user to Spotify login */}
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