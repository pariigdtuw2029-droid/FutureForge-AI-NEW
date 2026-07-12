def calculate_ats_score(parsed_data: dict) -> dict:
    score = 0
    strengths = []
    weaknesses = []
    suggestions = []

    if parsed_data.get("email"):
        score += 10
        strengths.append("Email found")
    else:
        weaknesses.append("Email missing")
        suggestions.append("Add a professional email address")

    if parsed_data.get("phone"):
        score += 10
        strengths.append("Phone number found")
    else:
        weaknesses.append("Phone number missing")
        suggestions.append("Add your contact number")

    skills = parsed_data.get("skills", [])

    score += min(len(skills) * 10, 50)

    if len(skills) >= 5:
        strengths.append("Good technical skill set")
    else:
        weaknesses.append("Limited technical skills")
        suggestions.append("Add more relevant technical skills")

    return {
        "ats_score": score,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions,
    }