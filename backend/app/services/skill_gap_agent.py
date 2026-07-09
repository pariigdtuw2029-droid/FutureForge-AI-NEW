import os
from dotenv import load_dotenv
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma


load_dotenv()


BASE_DIR = os.path.dirname(__file__)
CHROMA_DIR = os.path.join(os.path.dirname(__file__), "..", "chroma_db")
CHROMA_DIR = os.path.abspath(CHROMA_DIR)



class SkillGapResult(BaseModel):
    target_role: str
    matched_skills: list[str]
    missing_required_skills: list[str]
    missing_preferred_skills: list[str]
    project_gaps: list[str]
    skill_match_score: int
    priority_skills_to_learn: list[str]
    summary: str


def get_role_context(target_role: str, k: int = 3) -> str:
    embeddings = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        google_api_key=os.getenv("GEMINI_API_KEY")
    )

    vector_store = Chroma(
        persist_directory=CHROMA_DIR,
        embedding_function=embeddings
    )

    query = f"Required skills, preferred skills, expected projects, and common skill gaps for {target_role}"
    docs = vector_store.similarity_search(query, k=k)
    return "\n\n".join(doc.page_content for doc in docs)


def analyze_skill_gap(resume_info: dict, target_role: str) -> SkillGapResult:
    retrieved_context = get_role_context(target_role)
    resume_data = resume_info

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY")
    )
    structured_llm = llm.with_structured_output(SkillGapResult)

    prompt = f"""
You are a Skill Gap Analysis Agent.

Your job is to compare the candidate's resume with the target role requirements.

Target Role:
{target_role}

Candidate Resume Data:
{resume_info}

Retrieved Role Knowledge:
{retrieved_context}

Instructions:
1. Compare the candidate's skills, projects, education, and experience against the target role.
2. Identify:
   - matched_skills
   - missing_required_skills
   - missing_preferred_skills
   - project_gaps
3. Give a skill_match_score from 0 to 100.
4. Give priority_skills_to_learn.
5. Write a short summary.

Rules:
- Use the retrieved role knowledge as grounding.
- Do not invent fake projects or experience.
- Be specific and role-oriented.

Return structured output only.
"""

    return structured_llm.invoke(prompt)