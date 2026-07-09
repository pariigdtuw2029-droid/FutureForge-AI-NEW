from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_resume_without_file():

    response = client.post("/resume-interview")

    assert response.status_code in [200, 422]