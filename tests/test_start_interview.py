from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_start_interview():

    response = client.post(
        "/start-interview",
        json={
            "role": "Python Developer",
            "difficulty": "Easy"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "success"
    assert "question" in data
    assert "session_id" in data