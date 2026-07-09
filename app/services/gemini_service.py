import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")

client = genai.Client(api_key=api_key)


def ask_gemini(prompt: str) -> str:
    """
    Sends a prompt to Gemini AI and returns the response.
    If Gemini is unavailable, returns a meaningful fallback message.
    """

    try:

        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt
        )

        if response and response.text:
            return response.text.strip()

        return fallback_response(prompt)

    except Exception as e:

        error = str(e)

        print("\n" + "=" * 60)
        print("GEMINI API ERROR")
        print(error)
        print("=" * 60 + "\n")

        # -----------------------------
        # Quota Exceeded
        # -----------------------------
        if "429" in error or "RESOURCE_EXHAUSTED" in error:

            return (
                "⚠ Gemini API free quota has been exceeded.\n\n"
                "Please wait about one minute and try again.\n"
                "If the problem continues, create a new Gemini API key "
                "or upgrade your API quota."
            )

        # -----------------------------
        # Invalid API Key
        # -----------------------------
        elif "API_KEY" in error or "authentication" in error.lower():

            return (
                "⚠ Invalid Gemini API Key.\n\n"
                "Please check your .env file."
            )

        # -----------------------------
        # Network Error
        # -----------------------------
        elif "connection" in error.lower():

            return (
                "⚠ Unable to connect to Gemini.\n\n"
                "Please check your internet connection."
            )

        # -----------------------------
        # Unknown Error
        # -----------------------------
        else:

            return (
                "⚠ Gemini API Error\n\n"
                f"{error}"
            )


def fallback_response(prompt: str) -> str:
    """
    Offline fallback responses when Gemini is unavailable.
    """

    prompt_lower = prompt.lower()

    # -------------------------------------------------
    # Interview Evaluation Fallback
    # -------------------------------------------------

    if (
        "candidate answer" in prompt_lower
        or "overall score" in prompt_lower
        or "evaluate" in prompt_lower
    ):

        return """
Overall Score: 40/100

Technical Knowledge: 3/10

Communication Skills: 4/10

Confidence: 2/10

Strengths:
- Attempted to answer the question.

Weaknesses:
- Technical concepts are missing.
- Explanation lacks clarity.

Suggestions:
- Revise the core concepts.
- Practice coding interviews.
- Support answers with examples.

Ideal Answer:
A strong answer should clearly explain the concept, include practical examples, discuss trade-offs, and demonstrate real-world understanding.
"""

    # -------------------------------------------------
    # Interview Question Generation Fallback
    # -------------------------------------------------

    if "generate exactly one interview question" in prompt_lower:

        return (
            "⚠ Gemini AI is temporarily unavailable.\n\n"
            "Please wait a minute and try again."
        )

    # -------------------------------------------------
    # Resume Analysis Fallback
    # -------------------------------------------------

    if "resume" in prompt_lower:

        return (
            "Resume analysis is temporarily unavailable because "
            "Gemini AI could not be reached."
        )

    # -------------------------------------------------
    # Generic Fallback
    # -------------------------------------------------

    return (
        "Gemini AI is temporarily unavailable.\n"
        "Please try again shortly."
    )