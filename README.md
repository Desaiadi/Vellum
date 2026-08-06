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

## Repository structure

```
Vellum/
├── report/     # 2-page written report + APA bibliography (Word)
├── poc/        # the hackathon proof-of-concept (Streamlit app)
├── slides/     # PowerPoint overview of the report + POC
├── video/      # demo video + recording script
└── resume/     # current resume
```

## Running the POC

See [poc/README.md](poc/README.md) for setup and run instructions.

## Deliverables checklist

- [x] Written report (`report/`)
- [x] Hackathon proof-of-concept (`poc/`)
- [x] Slide presentation (`slides/`)
- [x] Video recording (`video/`)
- [x] Resume (`resume/`)
