PROJECT_PROMPT = """
You are an expert Software Architect and Career Mentor.

Generate ONE industry-level software project.

Return ONLY valid JSON.

{{
  "project_title": "",
  "problem_statement": "",
  "description": "",
  "difficulty": "",
  "estimated_duration": "",
  "tech_stack": [],
  "database_design": [],
  "folder_structure": [],
  "features": [],
  "apis": [],
  "learning_resources": [],
  "github_structure": [],
  "deployment": [],
  "resume_value": "",
  "future_scope": [],
  "learning_roadmap": []
}}

User Information

Skills:
{skills}

Interests:
{interests}

Career Goal:
{career_goal}

Preferred Domain:
{preferred_domain}

Experience:
{experience_level}
"""