from app.services.gemini_service import ask_gemini


def generate_question(role: str, difficulty: str):

    prompt = f"""
You are a Senior Technical Interviewer at Google.

Generate EXACTLY ONE interview question.

Candidate Role:
{role}

Difficulty:
{difficulty}

Difficulty Rules:

Easy:
- Ask one basic conceptual question.
- Suitable for beginners.
- Maximum 15 words.

Medium:
- Ask one practical or scenario-based question.
- Maximum 20 words.

Hard:
- Ask one advanced interview question.
- Focus on architecture, optimization, debugging, scalability, concurrency, security, databases, or system design.
- Maximum 30 words.
- Maximum 2 sentences.

General Rules:

- The question MUST match the candidate role.
- Ask ONLY ONE question.
- Keep it concise and natural.
- Difficulty should come from the concept, NOT the length.
- Never ask multiple questions.
- Never use bullet points.
- Never explain the question.
- Never provide hints.
- Never provide the answer.
- Do NOT write:
  "Here is your interview question"
  "Sure!"
  "Certainly!"
  "Interview Question:"
  "Question:"
- Return ONLY the question text.

Examples:

Easy:
What is the difference between a list and a tuple in Python?

Medium:
How would you optimize a slow SQL query joining multiple tables?

Hard:
How would you design a scalable URL shortening service that handles millions of requests per day?

Return ONLY the interview question.
"""

    return ask_gemini(prompt)