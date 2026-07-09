import os
from dotenv import load_dotenv
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

load_dotenv()
import os
APP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CHROMA_DIR = os.path.join(APP_DIR, "chroma_db")



class LearningPhase(BaseModel):
    phase: str
    focus_skills: list[str]
    topics: list[str]
    deliverable: str


class LearningPlanResult(BaseModel):
    target_role: str
    current_strengths: list[str]
    priority_skills_to_learn: list[str]
    learning_plan: list[LearningPhase]
    recommended_projects: list[str]
    summary: str


def get_learning_context(target_role: str, k: int = 4) -> str:
    embeddings = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        google_api_key=os.getenv("GEMINI_API_KEY")
    )

    vector_store = Chroma(
        persist_directory=CHROMA_DIR,
        embedding_function=embeddings
    )

    query = f"Learning roadmap, required skills, project suggestions, and progression plan for {target_role}"
    docs = vector_store.similarity_search(query, k=k)
    return "\n\n".join(doc.page_content for doc in docs)

def generate_learning_plan(
    resume_info: dict,
    skill_gap: dict,
    target_role: str
) -> LearningPlanResult:
    learning_context = get_learning_context(target_role)

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY")
    )
    structured_llm = llm.with_structured_output(LearningPlanResult)

    prompt = f"""
You are a Learning Planner Agent.

Target Role:
{target_role}

Candidate Resume Data:
{resume_info}

Skill Gap Analysis:
{skill_gap}

Retrieved Learning Context:
{learning_context}

Instructions:
1. Identify the candidate's current strengths.
2. Focus especially on:
   - missing_required_skills
   - missing_preferred_skills
   - project_gaps
   - priority_skills_to_learn
3. Create a realistic 3-phase learning plan:
   - Phase 1: Foundations / immediate weak areas
   - Phase 2: Core role preparation
   - Phase 3: Projects / portfolio readiness
4. For each phase return:
   - phase
   - focus_skills
   - topics
   - deliverable
5. Recommend 2 to 4 projects.
6. Keep it practical for an internship-seeking student.

Return structured output only.
"""

    return structured_llm.invoke(prompt)

