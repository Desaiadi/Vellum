# Vellum

**Cotiviti Intern Assessment — Clinical Natural Language Technology for Health Care**

Vellum is a proof-of-concept clinical chart coding assistant. It compares three ways of turning a scanned clinical note into structured, billable diagnosis/procedure codes:

1. **Classic pipeline** — OCR (Tesseract) extracts text, then a large language model reads the text and suggests ICD-10/CPT codes with evidence citations. This mirrors the "present" of clinical NLP: a document-processing pipeline bolted onto a general-purpose LLM.
2. **Multimodal (LMM) pipeline** — a vision-capable LLM reads the note image directly, no OCR step at all. This is the "future" approach the report discusses: end-to-end multimodal understanding.
3. **Local/offline pipeline** — the same comparison run against an on-device model via [Ollama](https://ollama.com), so inference has zero marginal API cost.

The goal is to show, hands-on, how OCR + NLP + Computer Vision + LLM/LMM approaches to clinical document understanding differ — and why that matters for a payment-integrity company like Cotiviti, where faster and more accurate chart coding directly affects claims auditing.

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
