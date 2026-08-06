"""Vellum extraction pipelines.

Two extraction strategies, each runnable against two backends:

  classic_pipeline(image, backend)     -> OCR (Tesseract) then a text-only LLM call
  multimodal_pipeline(image, backend)  -> the image goes straight to a vision LLM

backend is one of "claude" (Anthropic API) or "ollama" (local, offline, free).
"""

import base64
import io
import json
import time
from dataclasses import dataclass, field

import pytesseract
from PIL import Image

import config


EMPTY_RECORD = {
    "patient": {"name": "N/A", "dob": "N/A", "mrn": "N/A", "confidence": "low"},
    "provider": {"name": "N/A", "identifier": "N/A", "confidence": "low"},
    "dates": {"date_of_service": "N/A", "confidence": "low"},
    "diagnoses": [],
    "procedures": [],
    "needs_review": True,
}


@dataclass
class PipelineResult:
    pipeline_name: str
    backend: str
    record: dict = field(default_factory=lambda: dict(EMPTY_RECORD))
    ocr_text: str | None = None
    elapsed_seconds: float = 0.0
    error: str | None = None


def _image_to_png_bytes(image: Image.Image) -> bytes:
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


def _parse_record_json(raw_text: str) -> dict:
    """Best-effort JSON parse — local models don't always honor strict JSON mode."""
    text = raw_text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        text = text.split("\n", 1)[-1] if "\n" in text else text
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        text = text[start : end + 1]
    data = json.loads(text)
    merged = dict(EMPTY_RECORD)
    merged.update(data)
    return merged


# --------------------------------------------------------------------------
# Claude backend
# --------------------------------------------------------------------------


def _claude_client():
    import anthropic

    if not config.ANTHROPIC_API_KEY:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Add it to poc/.env (see .env.example)."
        )
    return anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)


def _claude_extract_from_text(ocr_text: str) -> dict:
    client = _claude_client()
    response = client.messages.create(
        model=config.CLAUDE_MODEL,
        max_tokens=2000,
        output_config={"format": {"type": "json_schema", "schema": config.EXTRACTION_SCHEMA}},
        messages=[
            {
                "role": "user",
                "content": (
                    f"{config.EXTRACTION_INSTRUCTIONS}\n\n"
                    f"--- OCR'd document text ---\n{ocr_text}"
                ),
            }
        ],
    )
    text_block = next(b.text for b in response.content if b.type == "text")
    return _parse_record_json(text_block)


def _claude_extract_from_image(image: Image.Image) -> dict:
    client = _claude_client()
    image_b64 = base64.standard_b64encode(_image_to_png_bytes(image)).decode("utf-8")
    response = client.messages.create(
        model=config.CLAUDE_MODEL,
        max_tokens=2000,
        output_config={"format": {"type": "json_schema", "schema": config.EXTRACTION_SCHEMA}},
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": image_b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            f"{config.EXTRACTION_INSTRUCTIONS}\n\n"
                            "Read the document directly from the image above — "
                            "no OCR step was run."
                        ),
                    },
                ],
            }
        ],
    )
    text_block = next(b.text for b in response.content if b.type == "text")
    return _parse_record_json(text_block)


# --------------------------------------------------------------------------
# Ollama backend (local, offline)
# --------------------------------------------------------------------------


_OLLAMA_JSON_SHAPE_HINT = (
    'Respond with ONLY valid JSON in this exact shape: '
    '{"patient": {"name": "...", "dob": "...", "mrn": "...", "confidence": "high|medium|low"}, '
    '"provider": {"name": "...", "identifier": "...", "confidence": "high|medium|low"}, '
    '"dates": {"date_of_service": "...", "confidence": "high|medium|low"}, '
    '"diagnoses": [{"description": "...", "code": "...", "evidence_quote": "...", '
    '"confidence": "high|medium|low", "needs_review": true|false}], '
    '"procedures": [{"description": "...", "code": "...", "evidence_quote": "...", '
    '"confidence": "high|medium|low", "needs_review": true|false}], '
    '"needs_review": true|false}'
)


def _ollama_extract_from_text(ocr_text: str) -> dict:
    import ollama

    prompt = (
        f"{config.EXTRACTION_INSTRUCTIONS}\n\n"
        f"--- OCR'd document text ---\n{ocr_text}\n\n"
        f"{_OLLAMA_JSON_SHAPE_HINT}"
    )
    try:
        response = ollama.chat(
            model=config.OLLAMA_TEXT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            format="json",
        )
    except Exception as exc:
        raise RuntimeError(
            f"Could not reach local Ollama server ({exc}). "
            f"Run `ollama serve` and `ollama pull {config.OLLAMA_TEXT_MODEL}` first."
        ) from exc
    return _parse_record_json(response["message"]["content"])


def _ollama_extract_from_image(image: Image.Image) -> dict:
    import ollama

    prompt = (
        f"{config.EXTRACTION_INSTRUCTIONS}\n\n"
        "Read the document directly from the attached image — no OCR was run.\n\n"
        f"{_OLLAMA_JSON_SHAPE_HINT}"
    )
    try:
        response = ollama.chat(
            model=config.OLLAMA_VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                    "images": [_image_to_png_bytes(image)],
                }
            ],
        )
    except Exception as exc:
        raise RuntimeError(
            f"Could not reach local Ollama server ({exc}). "
            f"Run `ollama serve` and `ollama pull {config.OLLAMA_VISION_MODEL}` first."
        ) from exc
    return _parse_record_json(response["message"]["content"])


# --------------------------------------------------------------------------
# Public pipeline entry points
# --------------------------------------------------------------------------


def classic_pipeline(image: Image.Image, backend: str) -> PipelineResult:
    """OCR -> text-only LLM extraction — the conventional multi-stage pipeline
    that the multimodal approach below replaces. Kept as an optional comparison."""
    start = time.perf_counter()
    try:
        ocr_text = pytesseract.image_to_string(image)
        if backend == "claude":
            record = _claude_extract_from_text(ocr_text)
        elif backend == "ollama":
            record = _ollama_extract_from_text(ocr_text)
        else:
            raise ValueError(f"Unknown backend: {backend}")
        return PipelineResult(
            pipeline_name="Classic (OCR + text LLM)",
            backend=backend,
            record=record,
            ocr_text=ocr_text,
            elapsed_seconds=time.perf_counter() - start,
        )
    except Exception as exc:  # surfaced in the UI, not swallowed
        return PipelineResult(
            pipeline_name="Classic (OCR + text LLM)",
            backend=backend,
            elapsed_seconds=time.perf_counter() - start,
            error=str(exc),
        )


def multimodal_pipeline(image: Image.Image, backend: str) -> PipelineResult:
    """Single multimodal-model call: image -> full structured record, no OCR,
    no separate NER/normalization stage. This is Vellum's primary pipeline."""
    start = time.perf_counter()
    try:
        if backend == "claude":
            record = _claude_extract_from_image(image)
        elif backend == "ollama":
            record = _ollama_extract_from_image(image)
        else:
            raise ValueError(f"Unknown backend: {backend}")
        return PipelineResult(
            pipeline_name="Multimodal (single-model structured extraction)",
            backend=backend,
            record=record,
            elapsed_seconds=time.perf_counter() - start,
        )
    except Exception as exc:
        return PipelineResult(
            pipeline_name="Multimodal (single-model structured extraction)",
            backend=backend,
            elapsed_seconds=time.perf_counter() - start,
            error=str(exc),
        )
