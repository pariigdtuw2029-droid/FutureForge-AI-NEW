import os

from dotenv import load_dotenv
from google import genai

# -----------------------------
# Load Environment Variables
# -----------------------------
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError(
        "GEMINI_API_KEY not found. Please check your .env file."
    )

# -----------------------------
# Create Gemini Client
# -----------------------------
client = genai.Client(api_key=GEMINI_API_KEY)


def ask_gemini(prompt: str) -> str:
    """
    Sends a prompt to Gemini and returns the response text.
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        if not response or not getattr(response, "text", None):
            raise Exception("Gemini returned an empty response.")

        return response.text.strip()

    except Exception as e:
        raise Exception(f"Gemini API Error: {str(e)}")