import os

from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet


def generate_report(interview):

    os.makedirs("reports", exist_ok=True)

    filename = f"reports/interview_report.pdf"

    doc = SimpleDocTemplate(filename)

    styles = getSampleStyleSheet()

    story = []

    story.append(Paragraph("<b>AI Interview Report</b>", styles["Title"]))

    story.append(Paragraph(f"<b>Role:</b> {interview['role']}", styles["BodyText"]))

    story.append(Paragraph(f"<b>Difficulty:</b> {interview['difficulty']}", styles["BodyText"]))

    story.append(Paragraph(f"<b>Date:</b> {interview['timestamp']}", styles["BodyText"]))

    story.append(Paragraph("<br/>", styles["BodyText"]))

    story.append(Paragraph("<b>Interview Question</b>", styles["Heading2"]))

    story.append(Paragraph(interview["question"], styles["BodyText"]))

    story.append(Paragraph("<br/>", styles["BodyText"]))

    story.append(Paragraph("<b>Candidate Answer</b>", styles["Heading2"]))

    story.append(Paragraph(interview["answer"], styles["BodyText"]))

    story.append(Paragraph("<br/>", styles["BodyText"]))

    story.append(Paragraph("<b>AI Feedback</b>", styles["Heading2"]))

    story.append(Paragraph(interview["feedback"].replace("\n", "<br/>"), styles["BodyText"]))

    doc.build(story)

    return filename