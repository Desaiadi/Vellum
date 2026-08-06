"""Vellum's grounded chatbot.

"RAG-lite": the report, project description, and builder profile together
are well under 4K tokens, so the whole corpus is included directly in the
system prompt on every request rather than chunked and embedded in a vector
store. At this corpus size that's simpler to build and more reliably
grounded than retrieval (no retrieval-miss risk) — a deliberate, disclosed
substitution for a full RAG pipeline, not a silent shortcut.
"""

import anthropic

import config

SYSTEM_PROMPT_TEMPLATE = """\
You are the assistant embedded in Vellum, a clinical document intake proof \
of concept. Answer questions about the project, the accompanying written \
report, and the builder's background — using ONLY the context below. If \
something isn't covered by this context, say so plainly rather than \
guessing or inventing details.

If asked to simplify, explain, or clarify part of the report ("I didn't \
understand this part", "explain like I'm new to this"), rewrite that idea \
in plain, jargon-free language — a sentence or two, not a re-quote of the \
source text.

Keep answers concise and conversational. This may be read by a recruiter \
or reviewer who has never seen the project before, so don't assume they've \
read the report already.

--- PROJECT INFO ---
{project_info}

--- BUILDER PROFILE ---
{profile}

--- WRITTEN REPORT ---
{report}
"""


def _build_system_prompt() -> str:
    project_info = (config.KNOWLEDGE_DIR / "project_info.md").read_text()
    profile = (config.KNOWLEDGE_DIR / "profile.md").read_text()
    report = (config.KNOWLEDGE_DIR / "report.md").read_text()
    return SYSTEM_PROMPT_TEMPLATE.format(
        project_info=project_info, profile=profile, report=report
    )


def _client() -> anthropic.Anthropic:
    if not config.ANTHROPIC_API_KEY:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Add it to webapp/backend/.env."
        )
    return anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)


def chat(message: str, history: list[dict]) -> str:
    """history: list of {role: 'user'|'assistant', content: str}, oldest first."""
    client = _client()
    messages = [
        {"role": h["role"], "content": h["content"]}
        for h in history
        if h.get("role") in ("user", "assistant") and h.get("content")
    ]
    messages.append({"role": "user", "content": message})

    response = client.messages.create(
        model=config.CHAT_MODEL,
        max_tokens=1024,
        system=_build_system_prompt(),
        messages=messages,
    )
    return next(b.text for b in response.content if b.type == "text")
