from fastapi import HTTPException


class AIServiceException(HTTPException):
    def __init__(self, detail="AI Service is temporarily unavailable"):
        super().__init__(
            status_code=503,
            detail=detail
        )