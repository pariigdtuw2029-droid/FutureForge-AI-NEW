from pydantic import BaseModel

from app.services.ai_clients import get_chat_llm, retrieve_context


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
    query = (
        f"Learning roadmap, required skills, project suggestions, and "
        f"progression plan for {target_role}"
    )
    return retrieve_context(query, k=k)


def generate_learning_plan(
    resume_info: dict,
    skill_gap: dict,
    target_role: str
) -> LearningPlanResult:
    learning_context = get_learning_context(target_role)

    structured_llm = get_chat_llm().with_structured_output(LearningPlanResult)

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
