from pydantic import BaseModel

class StartInterviewRequest(BaseModel):
    role: str
    difficulty: str

class SubmitAnswerRequest(BaseModel):
    question: str
    answer: str