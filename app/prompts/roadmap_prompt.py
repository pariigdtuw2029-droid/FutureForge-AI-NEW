ROADMAP_PROMPT = """
You are an expert AI Career Mentor.

Create a personalized learning roadmap.

Student Profile

Skills: {skills}

Career Goal: {career_goal}

Experience Level: {experience_level}

Duration: {duration}

Return ONLY valid JSON.

{{
  "summary": "...",
  "roadmap": [
    {{
      "month": "Month 1",
      "topics": [
        "...",
        "..."
      ],
      "projects": [
        "...",
        "..."
      ]
    }},
    {{
      "month": "Month 2",
      "topics": [
        "...",
        "..."
      ],
      "projects": [
        "...",
        "..."
      ]
    }},
    {{
      "month": "Month 3",
      "topics": [
        "...",
        "..."
      ],
      "projects": [
        "...",
        "..."
      ]
    }}
  ]
}}
"""