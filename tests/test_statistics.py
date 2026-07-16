from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_statistics():

    response = client.get("/statistics")

    assert response.status_code == 200

    data = response.json()

    assert "total_interviews" in data
    assert "average_score" in data