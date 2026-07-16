from fastapi import APIRouter, File, UploadFile

from app.controllers.resume_controller import upload_resume

router = APIRouter(
    prefix="/resume",
    tags=["Resume"],
)


@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    return await upload_resume(file)