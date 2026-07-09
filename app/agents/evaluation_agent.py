from app.services.gemini_service import ask_gemini
from app.prompts.evaluation_prompt import get_evaluation_prompt


def evaluate(question: str, answer: str):

    prompt = get_evaluation_prompt(
        question,
        answer
    )

    return ask_gemini(prompt)