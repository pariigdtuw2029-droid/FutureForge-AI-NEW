from fastapi import APIRouter
from pydantic import BaseModel

from app.agents.question_agent import generate_question
from app.agents.evaluation_agent import evaluate

from app.utils.history_store import (
    save_history,
    get_history,
    get_statistics
)

from app.utils.session_manager import (
    create_session,
    get_session
)

router = APIRouter()


class StartInterviewRequest(BaseModel):
    role: str
    difficulty: str


class SubmitAnswerRequest(BaseModel):
    question: str
    answer: str


current_role = ""
current_difficulty = ""


@router.post("/start-interview")
def start_interview(data: StartInterviewRequest):

    global current_role
    global current_difficulty

    current_role = data.role
    current_difficulty = data.difficulty

    session_id = create_session()

    question = generate_question(
        data.role,
        data.difficulty
    )

    return {
        "status": "success",
        "session_id": session_id,
        "role": data.role,
        "difficulty": data.difficulty,
        "question": question
    }


@router.post("/submit-answer")
def submit_answer(data: SubmitAnswerRequest):

    feedback = evaluate(
        data.question,
        data.answer
    )

    save_history(
        current_role,
        current_difficulty,
        data.question,
        data.answer,
        feedback
    )

    return {
    "status": "success",
    "session_id": get_session(),
    "role": current_role,
    "difficulty": current_difficulty,
    "feedback": feedback
}

@router.get("/history")
def history():

    return get_history()


@router.get("/statistics")
def statistics():

    return get_statistics()