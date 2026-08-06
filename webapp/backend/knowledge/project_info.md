# About Vellum

**Vellum** is a proof-of-concept clinical document intake assistant, built for
the Cotiviti internship assessment (Clinical Natural Language Technology for
Health Care track).

## What it does

A single multimodal AI model (Claude, or a local open-source model via
Ollama) reads a scanned clinical billing document — a superbill or discharge
summary — and extracts a full structured record in one pass: patient info,
provider info, date of service, diagnoses (with suggested ICD-10 codes), and
procedures (with suggested CPT codes). Every field gets a confidence score
and a `needs_review` flag for anything ambiguous or low-confidence.

This replaces the conventional multi-stage pipeline (OCR → named-entity
recognition → code normalization) with one call, which is faster, has fewer
places to lose information, and is simpler to build and maintain.

The app also includes:
- An optional side-by-side comparison against the conventional OCR+LLM pipeline, so you can see exactly what the single-model approach replaces.
- Two inference backends: Claude API (cloud) and a fully local/offline Ollama model — tested against each other, honestly, including where the local model underperforms.
- Batch upload with a review queue and aggregate analytics (needs-review rate, confidence distribution) across processed documents.
- A structured-output de-identification toggle for downstream/analytics use of the extracted record.
- This chatbot, and an "About" page with a technical deep-dive: interactive architecture diagram, per-pipeline flows, the stack, the full API surface, design tradeoffs, the written report's findings in plain English, and a stated list of limitations.

## Content management (the "Policy" tab)

A second workspace for healthcare policy documents — billing and coding
policies, clinical practice guidelines, and payer–provider contracts. Three
tools:

1. **Summarize** — a plain-English overview plus the key points, every concrete obligation the document imposes (with a supporting quote), any billing codes it references, and anything too ambiguous to act on.
2. **Compare versions** — a semantic diff between two versions of the same policy: what was added, removed, modified, or clarified; the practical impact of each change; and how material it is. It ignores pure formatting and renumbering.
3. **Convert to rules** — turns written policy into machine-readable logic. Output can be declarative JSON rules, executable Python, SQL against a claims table, or a list of model features. Each rule carries its condition, action, supporting quote, and a confidence level, plus the data fields needed to run it and explicit caveats wherever the policy is too vague to encode faithfully.

## Patient record explainer (the "My Record" tab)

A patient-facing tool. Upload a lab report, visit summary, or medical record
and it explains the document in plain language: what kind of document it is,
what it says overall, each result explained individually (what the test
measures and what that particular value generally indicates), general
possibilities that could explain the pattern, questions worth bringing to an
appointment, and how time-sensitive follow-up appears to be. There's also a
follow-up chat grounded in the uploaded document.

This is deliberately framed as an **educational explainer, not a diagnosis**.
It does not tell anyone what they have, and never advises starting, stopping,
or changing a medication or treatment. Possibilities are described as things
a clinician would consider, not conclusions about the person. If anything in
the document looks potentially serious or time-sensitive, it says so plainly
and raises the urgency level rather than offering false reassurance.

## What it does NOT do

- It is **not** a certified medical coding tool. ICD-10/CPT suggestions are illustrative for a demo, not a billing-ready determination — a human coder should review every line.
- It does **not** redact PHI from the source document image before sending it to a model backend — the multimodal pipeline works by having the model read the image directly, so it necessarily sees whatever is in that image. The de-identification feature works on the already-extracted structured output, for downstream use, not as pre-send image redaction.
- It does not persist data — batch results live in the browser session only; there's no database.
- It has not been validated against real, HIPAA-covered patient data. All sample documents bundled with the project are synthetic and fabricated for demo purposes.

## Tech stack

- Backend: Python, Flask, the Anthropic Python SDK (Claude), the `ollama` Python client (local inference), Tesseract (OCR for the comparison pipeline).
- Frontend: React (Vite), Tailwind CSS.
- An earlier, simpler version of this same proof of concept was also built in Streamlit — kept in the project's `poc/` folder as a lightweight fallback.

## Deliverables in this repository

- `report/` — the 2-page written report (with this content) and its bibliography.
- `poc/` — the original Streamlit proof of concept.
- `webapp/` — this Flask + React version.
- `slides/` — a slide deck summarizing the report and the proof of concept.
- `video/` — a recording script (and, once recorded, the demo video).
- `resume/` — the builder's resume.

## Who built this

Built by **Aditya Arvind Desai** for the Cotiviti intern assessment. See the
builder's profile/background for more detail if asked.
