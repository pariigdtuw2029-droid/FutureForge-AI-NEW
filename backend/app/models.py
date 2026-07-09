from datetime import datetime


# -------------------------
# User Model
# -------------------------

def create_user_document(name: str, email: str, password: str):
    return {
        "name": name,
        "email": email,
        "password": password,
        "created_at": datetime.utcnow()
    }


# -------------------------
# Memory Model
# -------------------------

def create_memory_document(
    user_email: str,
    skills: list,
    goals: list,
    projects: list,
    resume_score: int
):
    return {
        "user_email": user_email,
        "skills": skills,
        "goals": goals,
        "projects": projects,
        "resume_score": resume_score,
        "updated_at": datetime.utcnow()
    }
def create_career_progress_document(
    user_email: str,
    current_role: str,
    target_role: str,
    completed_courses: list,
    completed_projects: list,
    progress_percentage: int
):
    return {
        "user_email": user_email,
        "current_role": current_role,
        "target_role": target_role,
        "completed_courses": completed_courses,
        "completed_projects": completed_projects,
        "progress_percentage": progress_percentage,
        "updated_at": datetime.utcnow()
    }


def create_weekly_report_document(
    user_email: str,
    week: str,
    completed_tasks: list,
    pending_tasks: list,
    hours_studied: int,
    report_summary: str
):
    return {
        "user_email": user_email,
        "week": week,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "hours_studied": hours_studied,
        "report_summary": report_summary,
        "created_at": datetime.utcnow()
    }