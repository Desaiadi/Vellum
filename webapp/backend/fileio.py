"""Turns an uploaded file (image or PDF) into a PIL Image, or into plain text."""

import io

import pytesseract
from PIL import Image

PDF_RENDER_DPI = 200

# Policy/contract documents can be long; cap what we send to the model.
MAX_TEXT_CHARS = 60_000


def open_document_image(file_storage) -> Image.Image:
    """Accepts a Flask FileStorage. Images open directly; PDFs render their
    first page to an image at PDF_RENDER_DPI (multi-page PDFs — e.g. a
    multi-page discharge summary — only use page 1 for now)."""
    filename = (getattr(file_storage, "filename", "") or "").lower()
    content_type = getattr(file_storage, "content_type", "") or ""
    data = file_storage.read()

    if filename.endswith(".pdf") or content_type == "application/pdf":
        import fitz  # PyMuPDF

        doc = fitz.open(stream=data, filetype="pdf")
        try:
            if doc.page_count == 0:
                raise ValueError("The uploaded PDF has no pages.")
            pixmap = doc[0].get_pixmap(dpi=PDF_RENDER_DPI)
            return Image.open(io.BytesIO(pixmap.tobytes("png"))).convert("RGB")
        finally:
            doc.close()

    return Image.open(io.BytesIO(data)).convert("RGB")


def extract_text(file_storage) -> str:
    """Plain text from an uploaded document. PDFs use their embedded text layer
    when there is one (fast, exact) and fall back to OCR of the rendered pages
    for scanned PDFs. Images always go through OCR."""
    filename = (getattr(file_storage, "filename", "") or "").lower()
    content_type = getattr(file_storage, "content_type", "") or ""
    data = file_storage.read()

    if filename.endswith(".pdf") or content_type == "application/pdf":
        import fitz  # PyMuPDF

        doc = fitz.open(stream=data, filetype="pdf")
        try:
            pages = [page.get_text() for page in doc]
            text = "\n\n".join(pages).strip()
            if len(text) < 40:  # scanned PDF with no text layer — OCR it
                text = "\n\n".join(
                    pytesseract.image_to_string(
                        Image.open(io.BytesIO(page.get_pixmap(dpi=PDF_RENDER_DPI).tobytes("png")))
                    )
                    for page in doc
                ).strip()
        finally:
            doc.close()
    elif filename.endswith(".txt") or content_type.startswith("text/"):
        text = data.decode("utf-8", errors="replace").strip()
    else:
        text = pytesseract.image_to_string(Image.open(io.BytesIO(data)).convert("RGB")).strip()

    if not text:
        raise ValueError("Couldn't read any text out of that file.")
    return text[:MAX_TEXT_CHARS]
