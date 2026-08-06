"""Central config for Vellum: models, defaults, env loading."""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# Claude model used for the classic/multimodal extraction pipelines.
# Configurable via env var so switching models never requires a code change.
CLAUDE_MODEL = os.environ.get("VELLUM_CLAUDE_MODEL", "claude-sonnet-5")

# Model used for the chatbot and report-summary/explain endpoints. Kept
# separate from CLAUDE_MODEL so extraction and chat can be tuned independently.
CHAT_MODEL = os.environ.get("VELLUM_CHAT_MODEL", "claude-sonnet-5")

# Local Ollama models (pulled separately by the user — see poc/README.md).
# Small models by default so the demo stays fast and light on disk/RAM.
OLLAMA_TEXT_MODEL = os.environ.get("VELLUM_OLLAMA_TEXT_MODEL", "llama3.2:1b")
OLLAMA_VISION_MODEL = os.environ.get("VELLUM_OLLAMA_VISION_MODEL", "llava")

BACKENDS = {
    "claude": "Claude API (cloud)",
    "ollama": "Local Ollama (offline, free)",
}

BACKEND_DIR = Path(__file__).parent
KNOWLEDGE_DIR = BACKEND_DIR / "knowledge"
SAMPLE_DIR = BACKEND_DIR / "sample_data"
REPORT_SUMMARY_CACHE = KNOWLEDGE_DIR / "report_summary_cache.json"

CONFIDENCE_ENUM = {"type": "string", "enum": ["high", "medium", "low"]}

_CODE_ITEM = {
    "type": "object",
    "properties": {
        "description": {"type": "string", "description": "Free-text diagnosis or procedure as written"},
        "code": {"type": "string", "description": "Best-guess ICD-10-CM or CPT code, or 'N/A'"},
        "evidence_quote": {"type": "string", "description": "Short verbatim quote supporting this line"},
        "confidence": CONFIDENCE_ENUM,
        "needs_review": {
            "type": "boolean",
            "description": "true if this line is ambiguous, illegible, or low confidence and a human coder should check it",
        },
    },
    "required": ["description", "code", "evidence_quote", "confidence", "needs_review"],
    "additionalProperties": False,
}

# Full structured-record schema: one multimodal call replaces the conventional
# OCR -> NER -> code-normalization pipeline by extracting everything in one shot.
EXTRACTION_SCHEMA = {
    "type": "object",
    "properties": {
        "patient": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "or 'N/A' if not present"},
                "dob": {"type": "string", "description": "or 'N/A' if not present"},
                "mrn": {"type": "string", "description": "or 'N/A' if not present"},
                "confidence": CONFIDENCE_ENUM,
            },
            "required": ["name", "dob", "mrn", "confidence"],
            "additionalProperties": False,
        },
        "provider": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "or 'N/A' if not present"},
                "identifier": {"type": "string", "description": "NPI or provider ID, or 'N/A'"},
                "confidence": CONFIDENCE_ENUM,
            },
            "required": ["name", "identifier", "confidence"],
            "additionalProperties": False,
        },
        "dates": {
            "type": "object",
            "properties": {
                "date_of_service": {"type": "string", "description": "or 'N/A' if not present"},
                "confidence": CONFIDENCE_ENUM,
            },
            "required": ["date_of_service", "confidence"],
            "additionalProperties": False,
        },
        "diagnoses": {"type": "array", "items": _CODE_ITEM},
        "procedures": {"type": "array", "items": _CODE_ITEM},
        "needs_review": {
            "type": "boolean",
            "description": "true if ANY field or line item above is low confidence or flagged for review",
        },
    },
    "required": ["patient", "provider", "dates", "diagnoses", "procedures", "needs_review"],
    "additionalProperties": False,
}

EXTRACTION_INSTRUCTIONS = (
    "You are a clinical document intake assistant. Read this clinical billing "
    "document (a superbill or discharge summary) and extract a full structured "
    "record in one pass: patient info, provider info, date of service, every "
    "billable diagnosis, and every billable procedure. For each diagnosis, "
    "suggest the most likely ICD-10-CM code; for each procedure, suggest the "
    "most likely CPT code. Quote the short phrase that supports each line, and "
    "rate your confidence per field. Set needs_review=true on any line that is "
    "ambiguous, illegible (e.g. from image noise/blur), or where you are not "
    "confident in the code. Set the top-level needs_review=true if any field or "
    "line item needs review. If a field isn't present in the document, use "
    "'N/A' rather than guessing. These are illustrative best-guess codes for a "
    "demo, not a certified coding determination."
)
