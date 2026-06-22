from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import SplitRequest, SplitResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/split", response_model=SplitResponse)
def split(body: SplitRequest):
    return SplitResponse(message="received", job_id=body.job_id)