from fastapi import APIRouter, UploadFile, File, Form
import os
from datetime import datetime

from app.voice.audio_converter import convert_to_wav
from app.voice.speech_to_text import convert_audio_to_text
from app.agents.evaluation_agent import evaluate
from app.utils.history_store import save_history
from app.utils.audio_metadata import get_audio_metadata

router = APIRouter()

UPLOAD_FOLDER = "recordings"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/voice-interview")
async def voice_interview(

    question: str = Form(...),
    audio: UploadFile = File(...),
    role: str = Form("General"),
    difficulty: str = Form("Medium")

):

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    extension = os.path.splitext(audio.filename)[1]

    if extension == "":
        extension = ".webm"

    filename = f"recording_{timestamp}{extension}"

    file_path = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    with open(file_path, "wb") as buffer:

        buffer.write(await audio.read())

    metadata = get_audio_metadata(
        file_path,
        audio
    )

    audio_for_transcription = file_path

    if extension.lower() == ".webm":

        audio_for_transcription = convert_to_wav(file_path)

    transcript = convert_audio_to_text(
        audio_for_transcription
    )

    feedback = evaluate(
        question,
        transcript
    )

    save_history(
        role,
        difficulty,
        question,
        transcript,
        feedback
    )

    return {

        "status": "success",

        "recording": filename,

        "role": role,

        "difficulty": difficulty,

        "transcript": transcript,

        "feedback": feedback,

        "audio_metadata": metadata

    }