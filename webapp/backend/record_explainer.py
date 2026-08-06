"""Patient-facing medical record and lab report explainer.

Takes a medical record, discharge summary, or lab report and explains it in
plain language: what the document says, what each finding means, what could
generally explain it, and what to ask a clinician.

Deliberate framing: this is an *educational explainer*, not a diagnosis. The
prompts below require the model to describe possibilities in general terms,
to never tell the user what they have or what to take, and to surface
anything that looks urgent so the user is pushed toward real care rather than
away from it. The UI repeats the same disclaimer.
"""

import json

import anthropic

import config

DISCLAIMER = (
    "This is an educational explanation of what your document says — not a "
    "diagnosis and not medical advice. Only a clinician who knows your full "
    "history can tell you what this means for you."
)

EXPLAIN_SCHEMA = {
    "type": "object",
    "properties": {
        "document_type": {
            "type": "string",
            "description": "What kind of document this is, in plain words (e.g. 'blood test results')",
        },
        "plain_summary": {
            "type": "string",
            "description": "3-5 sentences: what this document says overall, in everyday language, no jargon",
        },
        "findings": {
            "type": "array",
            "description": "Each notable result, measurement, diagnosis, or note in the document",
            "items": {
                "type": "object",
                "properties": {
                    "label": {"type": "string", "description": "What it's called on the document"},
                    "value": {"type": "string", "description": "The reported value or wording, or 'N/A'"},
                    "reference_range": {
                        "type": "string",
                        "description": "The normal range as printed on the document, or 'not stated'",
                    },
                    "status": {
                        "type": "string",
                        "enum": ["normal", "borderline", "outside_range", "not_applicable", "unclear"],
                    },
                    "what_it_measures": {
                        "type": "string",
                        "description": "What this test or term actually is, explained simply",
                    },
                    "plain_meaning": {
                        "type": "string",
                        "description": "What this particular result generally indicates, in everyday language",
                    },
                },
                "required": [
                    "label",
                    "value",
                    "reference_range",
                    "status",
                    "what_it_measures",
                    "plain_meaning",
                ],
                "additionalProperties": False,
            },
        },
        "possible_explanations": {
            "type": "array",
            "description": "General, educational possibilities for the pattern seen — never stated as the user's diagnosis",
            "items": {
                "type": "object",
                "properties": {
                    "explanation": {"type": "string"},
                    "why_it_fits": {"type": "string"},
                },
                "required": ["explanation", "why_it_fits"],
                "additionalProperties": False,
            },
        },
        "questions_for_your_doctor": {
            "type": "array",
            "description": "Specific, useful questions this person could bring to their next appointment",
            "items": {"type": "string"},
        },
        "urgency": {
            "type": "string",
            "enum": ["routine", "discuss_at_next_visit", "contact_clinician_soon", "seek_care_now"],
            "description": "How time-sensitive following up appears to be, based only on what's written",
        },
        "urgency_reason": {"type": "string"},
    },
    "required": [
        "document_type",
        "plain_summary",
        "findings",
        "possible_explanations",
        "questions_for_your_doctor",
        "urgency",
        "urgency_reason",
    ],
    "additionalProperties": False,
}

SYSTEM_RULES = (
    "You are a careful medical explainer helping someone understand their own "
    "health document. Rules you always follow:\n"
    "- Explain what the document says. Do not diagnose the person, and do not "
    "tell them to start, stop, or change any medication or treatment.\n"
    "- When you describe what could be going on, frame it as general "
    "possibilities that a clinician would consider — never as a conclusion "
    "about this person.\n"
    "- Use everyday language. Define any medical term the first time you use "
    "it. No markdown formatting.\n"
    "- If anything in the document suggests a potentially serious or "
    "time-sensitive situation, say so plainly and set the urgency accordingly. "
    "Never downplay something concerning to be reassuring.\n"
    "- If the document is unclear or incomplete, say so rather than guessing."
)


def _client() -> anthropic.Anthropic:
    if not config.ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY is not set. Add it to webapp/backend/.env.")
    return anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)


def explain(text: str) -> dict:
    client = _client()
    response = client.messages.create(
        model=config.CHAT_MODEL,
        max_tokens=4000,
        system=SYSTEM_RULES,
        output_config={"format": {"type": "json_schema", "schema": EXPLAIN_SCHEMA}},
        messages=[
            {
                "role": "user",
                "content": (
                    "Explain this health document to the person it belongs to.\n\n"
                    f"--- DOCUMENT ---\n{text}"
                ),
            }
        ],
    )
    body = next(b.text for b in response.content if b.type == "text")
    result = json.loads(body)
    result["disclaimer"] = DISCLAIMER
    return result


def consult(question: str, record_text: str, history: list[dict]) -> str:
    """Follow-up Q&A grounded in the uploaded record."""
    client = _client()
    messages = [
        {"role": h["role"], "content": h["content"]}
        for h in history
        if h.get("role") in ("user", "assistant") and h.get("content")
    ]
    messages.append({"role": "user", "content": question})

    response = client.messages.create(
        model=config.CHAT_MODEL,
        max_tokens=1200,
        system=(
            f"{SYSTEM_RULES}\n\n"
            "Answer questions about the document below. Stay grounded in what it "
            "actually says; if the document doesn't cover something, say so and "
            "suggest asking their clinician. Keep answers short and "
            "conversational.\n\n"
            f"--- THE PERSON'S DOCUMENT ---\n{record_text}"
        ),
        messages=messages,
    )
    return next(b.text for b in response.content if b.type == "text")
