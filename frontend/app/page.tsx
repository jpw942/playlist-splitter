// tells Next.js this page runs in the browser so it can handle button clicks
"use client";

// useState lets us store a value on the page and update it without refreshing
import { useState } from "react";

export default function Home() {
  // stores the backend response — starts as null, updates when the button is clicked
  const [response, setResponse] = useState<string | null>(null);

  // sends an HTTP request to the backend and stores the response
  async function checkHealth() {
    const res = await fetch("http://localhost:8000/api/health"); // calls the backend health endpoint
    const data = await res.json(); // converts the response from raw text to a JS object
    setResponse(JSON.stringify(data)); // saves the response as a string to display on screen
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-semibold">Playlist Splitter</h1>
      {/* button that calls checkHealth when clicked */}
      <button
        onClick={checkHealth}
        className="px-4 py-2 bg-black text-white rounded-md hover:bg-zinc-700"
      >
        Check Backend Health
      </button>
      {/* only shows the response text if the button has been clicked */}
      {response && <p className="text-green-600">{response}</p>}
    </div>
  );
}
