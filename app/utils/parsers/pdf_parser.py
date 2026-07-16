import fitz  # PyMuPDF


def extract_pdf_text(file_path: str) -> str:
    text = ""

    document = fitz.open(file_path)

    for page in document:
        text += page.get_text()

    document.close()

    return text