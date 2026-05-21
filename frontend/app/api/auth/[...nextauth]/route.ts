// imports the GET and POST handlers that Auth.js generated in auth.ts
// these handlers process all OAuth callbacks from Spotify behind the scenes
import { handlers } from "@/auth";

export const { GET, POST } = handlers;