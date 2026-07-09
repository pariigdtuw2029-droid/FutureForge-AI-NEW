from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.interview import router as interview_router
from app.routes.resume import router as resume_router
from app.routes.voice import router as voice_router
from app.routes.report import router as report_router
from app.routes.audio_stream import router as audio_stream_router
from app.routes.recording import router as recording_router

app = FastAPI(
    title="AI Interview Assistant API"
)

# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Routes
# -----------------------------
app.include_router(interview_router)
app.include_router(resume_router)
app.include_router(voice_router)
app.include_router(report_router)
app.include_router(audio_stream_router)
app.include_router(recording_router)

# -----------------------------
# Home
# -----------------------------
@app.get("/")
def home():
    return {
        "message": "AI Interview Assistant API is running successfully!"
    }