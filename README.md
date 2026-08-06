# Vellum

**Cotiviti Intern Assessment — Clinical Natural Language Technology for Health Care**

Vellum is a proof-of-concept clinical document intake assistant. A single
multimodal model reads a scanned clinical billing document (superbill /
discharge summary) and extracts a full structured record — patient,
provider, dates, diagnoses (ICD-10), procedures (CPT) — with per-field
confidence scores and a `needs_review` flag, in one pass. This replaces
the conventional **OCR → NER → code-normalization** pipeline, which is
also included as an optional side-by-side comparison so you can see
exactly what the single-model approach replaces.

Everything runs against either a cloud backend (Claude API) or a fully
local/offline backend ([Ollama](https://ollama.com)), so the demo can also
show zero-marginal-cost, on-device inference — and the real reliability
gap between them.

The goal is to show, hands-on, how OCR + NLP + Computer Vision + LLM/LMM
approaches to clinical document understanding differ — and why that
matters for a payment-integrity company like Cotiviti, where faster and
more accurate chart intake directly affects claims auditing.

There are two runnable versions of the demo:

- **`webapp/`** — the flagship version: Flask + React, batch upload with a
  review queue and analytics dashboard, a de-identified view, a
  plain-English report summary, and a grounded chatbot that can answer
  questions about the project, the report, or the builder's background.
- **`poc/`** — the original, simpler Streamlit version, kept as a
  lightweight fallback.

## Repository structure

```
Vellum/
├── report/     # 2-page written report + APA bibliography (Word)
├── webapp/     # flagship demo: Flask API + React frontend
├── poc/        # original hackathon proof-of-concept (Streamlit app)
├── slides/     # PowerPoint overview of the report + POC
├── video/      # demo video + recording script
└── resume/     # current resume
```

## Running the demo

- Flagship (Flask + React): see [webapp/README.md](webapp/README.md).
- Original lightweight version (Streamlit): see [poc/README.md](poc/README.md).

## Deliverables checklist

- [x] Written report (`report/Vellum_Report.docx`)
- [x] Hackathon proof-of-concept (`webapp/`, with `poc/` as the original lightweight fallback)
- [x] Slide presentation (`slides/Vellum_Presentation.pptx`)
- [ ] Video recording — script ready at `video/script.md`, `.mp4` pending
- [x] Resume (`resume/Aditya_Desai_Resume.pdf`)
