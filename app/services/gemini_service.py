import json
import asyncio
from google import genai

from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)


async def generate_ai_response(prompt: str) -> dict:

    MAX_RETRIES = 3

    for attempt in range(MAX_RETRIES):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )

            text = response.text.strip()

            text = text.replace("```json", "")
            text = text.replace("```", "")
            text = text.strip()

            return json.loads(text)

        except Exception as e:

            print(f"Gemini Error (Attempt {attempt+1}):", e)

            if "503" in str(e) and attempt < MAX_RETRIES - 1:
                print("Retrying in 5 seconds...")
                await asyncio.sleep(5)
                continue

            return {
                "error": str(e)
            }