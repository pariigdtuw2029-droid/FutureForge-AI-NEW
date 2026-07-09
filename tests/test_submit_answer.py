from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_submit_answer():

    client.post(
        "/start-interview",
        json={
            "role": "Python Developer",
            "difficulty": "Easy"
        }
    )

    response = client.post(
        "/submit-answer",
        json={
            "question": "What is Python?",
            "answer": "Python is a programming language."
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "success"
    assert "feedback" in data