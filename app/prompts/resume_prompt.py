RESUME_ANALYSIS_PROMPT = """
You are an expert ATS Resume Analyzer.

Analyze the following resume.

Return ONLY valid JSON.

{{
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "missing_skills": [],
  "recommended_roles": [],
  "learning_roadmap": []
}}

Resume:

{resume_text}
"""
