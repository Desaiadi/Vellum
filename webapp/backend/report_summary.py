"""Plain-English report summary + on-demand passage explanations.

get_summary() is generated once and cached to disk (config.REPORT_SUMMARY_CACHE)
so the report panel doesn't cost an API call on every page load.
"""

import json

import anthropic

import config

SUMMARY_PROMPT = """\
Rewrite the report below as a plain-English summary for someone with no \
healthcare or ML background — 4 short paragraphs: (1) what the technology \
is, (2) how it's changing (past/present/future, in one or two sentences), \
(3) the main risk/opportunity for a company like Cotiviti, (4) the \
recommendation. No jargon, no citations, no bullet points — just clear \
prose a non-technical reader would understand in under a minute.

Plain text only — no markdown formatting (no **bold**, no headers, no \
asterisks of any kind). Start each paragraph with a short label like \
"What it is:" written in plain text, not bolded.

--- REPORT ---
{report}
"""

EXPLAIN_PROMPT = """\
A reader of the report below said they didn't understand this part:

"{snippet}"

Explain what it means in one or two plain-English sentences, as if to \
someone with no healthcare or ML background. Don't just repeat the text \
back — actually simplify it. Plain text only, no markdown formatting.

--- FULL REPORT (for context) ---
{report}
"""


def _client() -> anthropic.Anthropic:
    if not config.ANTHROPIC_API_KEY:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Add it to webapp/backend/.env."
        )
    return anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)


def get_summary() -> str:
    if config.REPORT_SUMMARY_CACHE.exists():
        cached = json.loads(config.REPORT_SUMMARY_CACHE.read_text())
        return cached["summary"]

    report = (config.KNOWLEDGE_DIR / "report.md").read_text()
    client = _client()
    response = client.messages.create(
        model=config.CHAT_MODEL,
        max_tokens=800,
        messages=[{"role": "user", "content": SUMMARY_PROMPT.format(report=report)}],
    )
    summary = next(b.text for b in response.content if b.type == "text")
    config.REPORT_SUMMARY_CACHE.write_text(json.dumps({"summary": summary}))
    return summary


def explain(snippet: str) -> str:
    report = (config.KNOWLEDGE_DIR / "report.md").read_text()
    client = _client()
    response = client.messages.create(
        model=config.CHAT_MODEL,
        max_tokens=300,
        messages=[
            {
                "role": "user",
                "content": EXPLAIN_PROMPT.format(snippet=snippet, report=report),
            }
        ],
    )
    return next(b.text for b in response.content if b.type == "text")
