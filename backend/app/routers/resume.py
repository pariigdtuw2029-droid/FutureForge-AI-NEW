import io

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.schemas import ResumeRequest
from app.services.resume_controller import analyze_resume_controller
from app.services.resume_service import get_all_resume_analysis
from app.services.pdf_reader import text_from_pdf

router = APIRouter(
    prefix="/resume",
    tags=["Resume Analyzer"],
)


@router.post(
    "/analyze",
    summary="Analyze resume text",
    description=(
        "Requires resume_text in the body. For uploading a PDF file "
        "directly, use POST /resume/upload instead."
    ),
)
async def analyze(data: ResumeRequest):
    if not data.resume_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="resume_text is required. To analyze a PDF file directly, use POST /resume/upload.",
        )
    return await analyze_resume_controller(data)


@router.post(
    "/upload",
    summary="Upload a resume PDF and analyze it",
    description=(
        "NEW (fixed integration gap): the frontend previously only sent a "
        "filename string to /resume/analyze, never the resume's actual "
        "content, so real analysis was never possible. This endpoint "
        "accepts a PDF file directly, extracts its text server-side, and "
        "runs the same analysis as /resume/analyze."
    ),
)
async def upload(target_role: str = Form(...), file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported.",
        )

    contents = await file.read()

    try:
        resume_text = text_from_pdf(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read PDF: {str(e)}",
        )

    if not resume_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No extractable text found in this PDF (it may be a scanned image).",
        )

    data = ResumeRequest(
        target_role=target_role,
        file_name=file.filename,
        resume_text=resume_text,
    )

    return await analyze_resume_controller(data)


@router.get("/history")
async def history():
    return get_all_resume_analysis()
