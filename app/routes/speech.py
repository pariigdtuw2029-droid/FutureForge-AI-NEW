from fastapi import APIRouter
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.speech.text_to_speech import text_to_speech

router = APIRouter()


class SpeechRequest(BaseModel):
    feedback: str


@router.post("/speak-feedback")
def speak_feedback(data: SpeechRequest):

    audio_file = text_to_speech(data.feedback)

    return FileResponse(
        audio_file,
        media_type="audio/mpeg",
        filename="feedback.mp3"
    )