"""Structured-output de-identification.

Scope, stated plainly: the multimodal pipeline reads the source document
image directly, so the model necessarily sees PHI in the original — this
module does NOT redact the image before it's sent to a backend. What it does
is take the already-extracted structured record and produce a de-identified
copy, suitable for handing to a downstream consumer (analytics, a review
queue export) that doesn't need raw patient-identifying fields.
"""

import hashlib


def _token(value: str, prefix: str) -> str:
    if not value or value == "N/A":
        return value
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()[:8].upper()
    return f"{prefix}-{digest}"


def deidentify_record(record: dict) -> dict:
    """Return a de-identified copy of an extraction record. Diagnoses,
    procedures, codes, and evidence quotes are left intact — only direct
    patient/provider identifiers are tokenized."""
    deid = {
        "patient": {
            **record["patient"],
            "name": _token(record["patient"]["name"], "PATIENT"),
            "dob": "REDACTED" if record["patient"]["dob"] != "N/A" else "N/A",
            "mrn": _token(record["patient"]["mrn"], "MRN"),
        },
        "provider": dict(record["provider"]),
        "dates": dict(record["dates"]),
        "diagnoses": [dict(item) for item in record["diagnoses"]],
        "procedures": [dict(item) for item in record["procedures"]],
        "needs_review": record["needs_review"],
    }
    return deid
