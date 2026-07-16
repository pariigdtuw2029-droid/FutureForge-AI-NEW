from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet


def generate_pdf(history):

    file_name = "Interview_Report.pdf"

    document = SimpleDocTemplate(file_name)

    styles = getSampleStyleSheet()

    elements = []

    elements.append(
        Paragraph("<b>AI Interview Report</b>", styles["Title"])
    )

    for interview in history:

        role = interview.get("role", "N/A")
        difficulty = interview.get("difficulty", "N/A")
        question = interview.get("question", "N/A")
        answer = interview.get("answer", "N/A")
        feedback = interview.get("feedback", "N/A")
        timestamp = interview.get("timestamp", "N/A")

        elements.append(
            Paragraph(f"<b>Role:</b> {role}", styles["Normal"])
        )

        elements.append(
            Paragraph(f"<b>Difficulty:</b> {difficulty}", styles["Normal"])
        )

        elements.append(
            Paragraph(f"<b>Question:</b> {question}", styles["Normal"])
        )

        elements.append(
            Paragraph(f"<b>Answer:</b> {answer}", styles["Normal"])
        )

        elements.append(
            Paragraph(f"<b>Feedback:</b> {feedback}", styles["Normal"])
        )

        elements.append(
            Paragraph(f"<b>Timestamp:</b> {timestamp}", styles["Normal"])
        )

        elements.append(
            Paragraph("<br/><br/>", styles["Normal"])
        )

    document.build(elements)

    return file_name