from app.audio.speech_to_text import convert_speech_to_text
from app.agents.evaluation_agent import evaluate


def evaluate_voice_answer(audio_path, question):

    transcript = convert_speech_to_text(audio_path)

    feedback = evaluate(
        question,
        transcript
    )

    return {
        "transcript": transcript,
        "feedback": feedback
    }