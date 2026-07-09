from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.utils.history_store import get_history
from app.reports.pdf_generator import generate_pdf

router = APIRouter()


@router.get("/download-report")
def download_report():

    history = get_history()

    pdf_path = generate_pdf(history)

    return FileResponse(
        path=pdf_path,
        filename="Interview_Report.pdf",
        media_type="application/pdf"
    )