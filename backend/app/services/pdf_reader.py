from pypdf import PdfReader


def text_from_pdf(pdf_source) -> str:
    """
    Extract text from a PDF.

    `pdf_source` can be a file path (str) OR a file-like/binary stream
    (e.g. io.BytesIO of an uploaded file's contents) — pypdf's PdfReader
    accepts either, so this now covers both call sites: reading from disk
    and reading directly from an UploadFile without saving it first.
    """
    reader = PdfReader(pdf_source)
    text = ""

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"

    return text
