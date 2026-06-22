from pydantic import BaseModel


class SplitRequest(BaseModel):
    playlist_id: str
    job_id: str


class SplitResponse(BaseModel):
    message: str
    job_id: str