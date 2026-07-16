from fastapi import APIRouter, UploadFile, File
import os

from app.resume.resume_parser import extract_resume_text
from app.agents.resume_agent import analyze_resume

router = APIRouter()

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/resume-interview")
async def resume_interview(resume: UploadFile = File(...)):

    file_path = os.path.join(
        UPLOAD_FOLDER,
        resume.filename
    )

    with open(file_path, "wb") as buffer:
        buffer.write(await resume.read())

    resume_text = extract_resume_text(file_path)

    analysis = analyze_resume(resume_text)

    return {
        "status": "success",
        "analysis": analysis
    }