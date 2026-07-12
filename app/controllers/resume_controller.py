import os
import shutil
from uuid import uuid4

from fastapi import HTTPException, UploadFile

from app.utils.parsers.docx_parser import extract_docx_text
from app.utils.parsers.pdf_parser import extract_pdf_text
from app.utils.parsers.resume_parser import parse_resume
from app.utils.ats_score import calculate_ats_score
from app.services.resume_service import save_resume
from app.services.resume_ai_service import analyze_resume_with_ai

UPLOAD_FOLDER = "uploads/resumes"


async def upload_resume(file: UploadFile):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    extension = os.path.splitext(file.filename)[1].lower()

    if extension not in [".pdf", ".docx"]:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are allowed.",
        )

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    unique_filename = f"{uuid4()}{extension}"
    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    if extension == ".pdf":
        resume_text = extract_pdf_text(file_path)
    else:
        resume_text = extract_docx_text(file_path)

    parsed_data = parse_resume(resume_text)
    ats_result = calculate_ats_score(parsed_data)
    ai_analysis = await analyze_resume_with_ai(resume_text)
    resume_document = {
    "file_name": file.filename,
    "parsed_data": parsed_data,
    "ats_result": ats_result,
    "ai_analysis":ai_analysis,
}

    resume_id = await save_resume(resume_document)
    return {
    "message": "Resume uploaded successfully",
    "resume_id": resume_id,
    "file_name": file.filename,
    "parsed_data": parsed_data,
    "ats_result": ats_result,
    "ai_analysis":ai_analysis,
}