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
# Initialize Gemini Client
# -----------------------------
client = genai.Client(
    api_key=GEMINI_API_KEY
)


# -----------------------------
# Gemini Function
# -----------------------------
def ask_gemini(prompt: str) -> str:
    """
    Sends prompt to Gemini and returns generated text.
    """

    try:

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )


        # Check empty response
        if not response or not response.text:
            raise Exception(
                "Gemini returned an empty response."
            )


        text = response.text.strip()


        # Remove markdown code blocks if Gemini returns JSON format
        if text.startswith("```json"):
            text = text.replace(
                "```json",
                "",
                1
            )

        if text.startswith("```"):
            text = text.replace(
                "```",
                "",
                1
            )

        if text.endswith("```"):
            text = text[:-3]


        return text.strip()


    except Exception as error:

        error_message = str(error)


        # Better quota error message
        if "429" in error_message:
            raise Exception(
                "Gemini quota exhausted. "
                "Please check your API plan or quota."
            )


        raise Exception(
            f"Gemini API Error: {error_message}"
        )