import re


def parse_resume(text: str) -> dict:
    email = ""
    phone = ""

    email_match = re.search(
        r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
        text,
    )

    if email_match:
        email = email_match.group()

    phone_match = re.search(
        r"(\+91[- ]?)?[6-9]\d{9}",
        text,
    )

    if phone_match:
        phone = phone_match.group()

    skills_database = [
        "Python",
        "Java",
        "C++",
        "JavaScript",
        "FastAPI",
        "React",
        "Node.js",
        "MongoDB",
        "SQL",
        "Git",
        "GitHub",
        "HTML",
        "CSS",
        "Machine Learning",
        "Deep Learning",
        "TensorFlow",
        "PyTorch",
        "Pandas",
        "NumPy",
    ]

    skills = []

    for skill in skills_database:
        if skill.lower() in text.lower():
            skills.append(skill)

    return {
        "email": email,
        "phone": phone,
        "skills": sorted(list(set(skills))),
    }