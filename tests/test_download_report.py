from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_download_report():

    response = client.get("/download-report")

    assert response.status_code == 200