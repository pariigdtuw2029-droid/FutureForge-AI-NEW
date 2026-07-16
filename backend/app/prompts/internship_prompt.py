INTERNSHIP_PROMPT = """
You are an AI Career Advisor.

Based on the following student profile, recommend the best internships.

Student Profile

Skills: {skills}

CGPA: {cgpa}

Location: {location}

Preferred Role: {preferred_role}

Preferred Company: {preferred_company}

Preferred Domain: {preferred_domain}

Expected Stipend: {expected_stipend}

Availability: {availability}

Return ONLY valid JSON.

{{
  "summary": "...",
  "recommended_internships": [
    {{
      "company": "...",
      "role": "...",
      "location": "...",
      "stipend": "...",
      "match_score": 95
    }}
  ],
  "missing_skills": [
    "...",
    "..."
  ],
  "learning_resources": [
    "...",
    "..."
  ]
}}
"""