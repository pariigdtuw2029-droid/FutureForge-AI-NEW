import json
import os
import re
from datetime import datetime
from app.utils.session_manager import get_session

FILE_PATH = "data/history.json"


def load_history():

    if not os.path.exists(FILE_PATH):
        return []

    try:
        with open(FILE_PATH, "r") as file:
            return json.load(file)
    except Exception:
        return []


def save_history(role, difficulty, question, answer, feedback):

    history = load_history()

    history.append({
        "session_id": get_session(),
        "role": role,
        "difficulty": difficulty,
        "question": question,
        "answer": answer,
        "feedback": feedback,
        "timestamp": datetime.now().strftime("%d-%m-%Y %I:%M:%S %p")
    })

    with open(FILE_PATH, "w") as file:
        json.dump(history, file, indent=4)


def get_history():
    return load_history()


def get_statistics():

    history = load_history()

    total = len(history)

    easy = 0
    medium = 0
    hard = 0

    scores = []

    for interview in history:

        difficulty = interview["difficulty"].lower()

        if difficulty == "easy":
            easy += 1
        elif difficulty == "medium":
            medium += 1
        elif difficulty == "hard":
            hard += 1

        match = re.search(r"Overall Score:\s*(\d+)", interview["feedback"])

        if match:
            scores.append(int(match.group(1)))

    average = round(sum(scores) / len(scores), 2) if scores else 0

    return {
        "total_interviews": total,
        "average_score": average,
        "easy": easy,
        "medium": medium,
        "hard": hard
    }