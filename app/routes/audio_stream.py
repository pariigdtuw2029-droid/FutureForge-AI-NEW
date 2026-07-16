from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import os

router = APIRouter()

UPLOAD_FOLDER = "stream_uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.websocket("/audio-stream")
async def audio_stream(websocket: WebSocket):

    await websocket.accept()

    file_path = os.path.join(
        UPLOAD_FOLDER,
        "live_audio.wav"
    )

    with open(file_path, "wb") as audio_file:

        try:
            while True:

                chunk = await websocket.receive_bytes()

                audio_file.write(chunk)

                await websocket.send_text(
                    f"Received {len(chunk)} bytes"
                )

        except WebSocketDisconnect:

            print("Audio stream ended.")