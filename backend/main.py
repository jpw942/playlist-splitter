from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # lets us allow requests from the frontend

# creates the web app that listens for incoming HTTP requests
app = FastAPI()

# allows the frontend (localhost:3000) to send requests to this backend
# without this, the browser blocks cross-origin requests by default
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # only allow requests from the Next.js frontend
    allow_methods=["*"],  # allow any HTTP method (GET, POST, etc.)
    allow_headers=["*"],  # allow any request headers
)

# endpoint that returns a simple status message to confirm the server is running
@app.get("/api/health")
def health():
    return {"status": "ok"}
