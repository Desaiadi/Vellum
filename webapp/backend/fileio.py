"""Turns an uploaded file (image or PDF) into a PIL Image the pipelines can use."""

import io

from PIL import Image

PDF_RENDER_DPI = 200


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
