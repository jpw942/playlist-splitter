// instrumentation.ts — runs once when the Next.js server starts,
// BEFORE any route modules or libraries are imported.
//
// We use this to patch the global fetch function early enough that
// even libraries that cache a reference to fetch at module load time
// (like oauth4webapi, used internally by Auth.js) will get our patched version.
//
// The patch fixes a bug in Auth.js beta.31: when exchanging an
// authorization code for Spotify access tokens, Auth.js sends
// redirect_uri=http://localhost:3000/... in the request body.
// Spotify's dashboard only has http://127.0.0.1:3000/... registered,
// so Spotify rejects the exchange with "invalid_grant".
// We intercept that outgoing request and correct the redirect_uri.

export async function register() {
  // Only run this on the Node.js server (not in the browser or Edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const redirectUri = `${process.env.AUTH_URL}/api/auth/callback/spotify`;
    const _originalFetch = globalThis.fetch;

    globalThis.fetch = async function patchedFetch(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      // Determine the target URL regardless of input type
      const url = input instanceof Request ? input.url : String(input);

      // Only intercept Spotify's token endpoint
      if (url === "https://accounts.spotify.com/api/token" && init?.body) {
        // oauth4webapi sends the body as a URLSearchParams object;
        // handle both URLSearchParams and plain string just in case
        let params: URLSearchParams;
        if (init.body instanceof URLSearchParams) {
          params = new URLSearchParams(init.body); // copy so we don't mutate the original
        } else {
          params = new URLSearchParams(String(init.body));
        }

        if (params.has("redirect_uri")) {
          params.set("redirect_uri", redirectUri);
          init = { ...init, body: params };
        }
      }

      return _originalFetch(input as RequestInfo | URL, init);
    };
  }
}