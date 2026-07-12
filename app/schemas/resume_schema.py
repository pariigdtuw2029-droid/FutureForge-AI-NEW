from pydantic import BaseModel


class ResumeUploadResponse(BaseModel):
    message: str
    file_name: str