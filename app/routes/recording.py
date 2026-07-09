from fastapi import APIRouter, UploadFile, File
import os
from datetime import datetime

router = APIRouter()

RECORDINGS_FOLDER = "recordings"
os.makedirs(RECORDINGS_FOLDER, exist_ok=True)


@router.post("/upload-recording")
async def upload_recording(audio: UploadFile = File(...)):

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    filename = f"recording_{timestamp}.webm"

    file_path = os.path.join(RECORDINGS_FOLDER, filename)

    with open(file_path, "wb") as buffer:
        buffer.write(await audio.read())

    return {
        "status": "success",
        "message": "Recording uploaded successfully.",
        "filename": filename,
        "path": file_path
    }