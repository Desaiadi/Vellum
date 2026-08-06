"""Content management for healthcare policy documents.

Covers billing & coding policies, clinical practice guidelines, and
payer–provider contracts:

  summarize(text, doc_type)      -> structured summary + key obligations
  compare(text_a, text_b)        -> what changed between two versions, and why it matters
  to_rules(text, target)         -> written policy turned into machine-readable rules / code
"""

import json

import anthropic

import config

DOC_TYPES = {
    "billing_policy": "a payer billing and coding policy",
    "clinical_guideline": "a clinical practice guideline",
    "payer_contract": "a payer–provider contract",
    "other": "a healthcare policy document",
}

TARGETS = {
    "rules_json": "a declarative JSON rule set",
    "python": "executable Python",
    "sql": "a SQL query against a claims table",
    "features": "a list of model features / decision inputs",
}


def _client() -> anthropic.Anthropic:
    if not config.ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY is not set. Add it to webapp/backend/.env.")
    return anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)


def _call(prompt: str, schema: dict, max_tokens: int = 4000) -> dict:
    client = _client()
    response = client.messages.create(
        model=config.CHAT_MODEL,
        max_tokens=max_tokens,
        output_config={"format": {"type": "json_schema", "schema": schema}},
        messages=[{"role": "user", "content": prompt}],
    )
    text = next(b.text for b in response.content if b.type == "text")
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        if response.stop_reason == "max_tokens":
            raise RuntimeError(
                "The document was too long to process in one pass — try a shorter "
                "excerpt or a single section."
            ) from exc
        raise


# --------------------------------------------------------------------------
# Summarize
# --------------------------------------------------------------------------

SUMMARY_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string", "description": "Short title for this document"},
        "plain_summary": {
            "type": "string",
            "description": "3-5 sentence plain-English summary a non-expert could follow",
        },
        "key_points": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "point": {"type": "string"},
                    "detail": {"type": "string"},
                },
                "required": ["point", "detail"],
                "additionalProperties": False,
            },
        },
        "obligations": {
            "type": "array",
            "description": "Concrete requirements, limits, or conditions the document imposes",
            "items": {
                "type": "object",
                "properties": {
                    "who": {"type": "string", "description": "Party the obligation falls on"},
                    "requirement": {"type": "string"},
                    "evidence_quote": {"type": "string", "description": "Short quote from the source"},
                },
                "required": ["who", "requirement", "evidence_quote"],
                "additionalProperties": False,
            },
        },
        "codes_referenced": {
            "type": "array",
            "description": "Any ICD-10, CPT, HCPCS, or revenue codes named in the document",
            "items": {"type": "string"},
        },
        "open_questions": {
            "type": "array",
            "description": "Anything ambiguous that a human should clarify",
            "items": {"type": "string"},
        },
    },
    "required": [
        "title",
        "plain_summary",
        "key_points",
        "obligations",
        "codes_referenced",
        "open_questions",
    ],
    "additionalProperties": False,
}


def summarize(text: str, doc_type: str = "other") -> dict:
    kind = DOC_TYPES.get(doc_type, DOC_TYPES["other"])
    prompt = (
        f"You are a healthcare policy analyst. The document below is {kind}. "
        "Summarize it for a mixed audience of coders, analysts, and managers: "
        "a plain-English overview, the key points, every concrete obligation or "
        "limit it imposes (with a short supporting quote), any billing/diagnosis "
        "codes it references, and anything genuinely ambiguous that a human "
        "should clarify. Write plainly, no markdown formatting.\n\n"
        f"--- DOCUMENT ---\n{text}"
    )
    return _call(prompt, SUMMARY_SCHEMA)


# --------------------------------------------------------------------------
# Compare two versions
# --------------------------------------------------------------------------

COMPARE_SCHEMA = {
    "type": "object",
    "properties": {
        "overview": {
            "type": "string",
            "description": "2-4 sentences on what changed overall and who it affects",
        },
        "changes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "change_type": {
                        "type": "string",
                        "enum": ["added", "removed", "modified", "clarified"],
                    },
                    "summary": {"type": "string", "description": "What changed, in one sentence"},
                    "before": {"type": "string", "description": "Prior wording, or 'N/A' if newly added"},
                    "after": {"type": "string", "description": "New wording, or 'N/A' if removed"},
                    "impact": {
                        "type": "string",
                        "description": "Practical consequence — who has to do something differently",
                    },
                    "materiality": {"type": "string", "enum": ["high", "medium", "low"]},
                },
                "required": ["change_type", "summary", "before", "after", "impact", "materiality"],
                "additionalProperties": False,
            },
        },
        "unchanged_but_notable": {
            "type": "array",
            "description": "Things a reader might assume changed but did not",
            "items": {"type": "string"},
        },
    },
    "required": ["overview", "changes", "unchanged_but_notable"],
    "additionalProperties": False,
}


def compare(text_a: str, text_b: str) -> dict:
    prompt = (
        "You are a healthcare policy analyst. Below are two versions of the same "
        "policy document. Identify every substantive difference — additions, "
        "removals, modifications, and clarifications — and for each one explain "
        "the practical impact and how material it is. Ignore pure formatting or "
        "renumbering. Also note anything a reader might wrongly assume changed. "
        "Write plainly, no markdown formatting.\n\n"
        f"--- VERSION A (earlier) ---\n{text_a}\n\n"
        f"--- VERSION B (later) ---\n{text_b}"
    )
    return _call(prompt, COMPARE_SCHEMA, max_tokens=4000)


# --------------------------------------------------------------------------
# Policy -> rules / code / features
# --------------------------------------------------------------------------

RULES_SCHEMA = {
    "type": "object",
    "properties": {
        "interpretation": {
            "type": "string",
            "description": "How the policy was read, and any assumption made to make it executable",
        },
        "rules": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string", "description": "Short stable identifier, e.g. R1"},
                    "description": {"type": "string"},
                    "condition": {
                        "type": "string",
                        "description": "The test, written as a readable logical expression",
                    },
                    "action": {
                        "type": "string",
                        "description": "What happens when the condition holds (deny, flag, allow, require...)",
                    },
                    "source_quote": {"type": "string"},
                    "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
                },
                "required": ["id", "description", "condition", "action", "source_quote", "confidence"],
                "additionalProperties": False,
            },
        },
        "code": {"type": "string", "description": "The generated artifact in the requested target form"},
        "inputs_required": {
            "type": "array",
            "description": "Data fields the rules need in order to run",
            "items": {"type": "string"},
        },
        "caveats": {
            "type": "array",
            "description": "Where the written policy is too vague to encode faithfully",
            "items": {"type": "string"},
        },
    },
    "required": ["interpretation", "rules", "code", "inputs_required", "caveats"],
    "additionalProperties": False,
}


def to_rules(text: str, target: str = "rules_json") -> dict:
    target_desc = TARGETS.get(target, TARGETS["rules_json"])
    prompt = (
        "You are a healthcare policy engineer. Convert the written policy below "
        f"into machine-readable logic, expressed as {target_desc}. Break it into "
        "discrete, individually testable rules; for each, give the condition, the "
        "action, the supporting quote, and how confident you are that the policy "
        "really says that. List the data fields the rules need as inputs. Be "
        "explicit in the caveats about anywhere the policy is too vague to encode "
        "faithfully — do not invent thresholds the text doesn't state. The 'code' "
        "field should contain only the artifact itself, no prose commentary.\n\n"
        f"--- POLICY ---\n{text}"
    )
    return _call(prompt, RULES_SCHEMA, max_tokens=10000)
