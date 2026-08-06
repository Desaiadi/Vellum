# Vellum POC — Clinical Chart Coding Assistant

POC for the Cotiviti intern assessment, topic: *Clinical Natural Language
Technology for Health Care*.

## What it does

A single multimodal model reads a scanned clinical billing document
(superbill / discharge summary) and extracts a full structured record —
patient, provider, date of service, diagnoses (ICD-10), and procedures
(CPT) — in one pass, replacing the conventional OCR → NER →
code-normalization pipeline. Every field carries a confidence score and a
`needs_review` flag for anything ambiguous, illegible, or low-confidence.

An optional secondary view runs the conventional pipeline (OCR + a
text-only LLM call) on the same document, so you can see exactly what the
single multimodal call replaces. Both pipelines run against either a
cloud backend (Claude API) or a fully local/offline backend (Ollama, zero
marginal cost per inference).

## Quickstart

```bash
cd poc && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
brew install tesseract   # OCR engine, needed for the comparison pipeline
cp .env.example .env     # then paste your ANTHROPIC_API_KEY into .env
streamlit run app.py
```

Pick a sample document (or upload your own) in the sidebar and click
**Extract structured record**.

### Optional: local/offline backend (zero API cost)

```bash
brew install ollama && ollama serve &
ollama pull llava        # vision model, for the multimodal pipeline
ollama pull llama3.2:1b  # text model, for the classic-pipeline comparison
```

Then pick "Local Ollama (offline, free)" in the sidebar instead of Claude API.

## Sample data

`sample_data/generate_samples.py` generates three synthetic documents
(two superbills, one discharge summary) rendered as images at varying scan
quality — clean, mild scan noise, and a degraded/blurred low-quality scan
— to stress-test extraction. All patient names, providers, and clinical
details are fabricated. **No real PHI is used anywhere in this repository.**
Regenerate with `python3 sample_data/generate_samples.py`.

## Output sample

Multimodal extraction on `superbill_2_degraded.png` (the blurred, degraded
scan) via Claude API — note the model correctly flags lower-confidence
procedure lines for review despite the image quality:

```json
{
  "patient": {"name": "Diego F. Castellano (fictional)", "dob": "02/27/1994", "mrn": "SYN-40587", "confidence": "high"},
  "provider": {"name": "Dr. Amara Solis, DO", "identifier": "1847362910", "confidence": "high"},
  "dates": {"date_of_service": "01/11/2026", "confidence": "high"},
  "diagnoses": [
    {"description": "Sprain of anterior cruciate ligament, right knee, initial encounter",
     "code": "S83.511A", "evidence_quote": "Sprain of anterior cruciate ligament, right knee, initial encounter",
     "confidence": "high", "needs_review": false},
    {"description": "Joint pain, right knee", "code": "M25.561",
     "evidence_quote": "Joint pain, right knee", "confidence": "high", "needs_review": false}
  ],
  "procedures": [
    {"description": "Office/outpatient visit, new patient, moderate complexity", "code": "99204",
     "evidence_quote": "Office/outpatient visit, new patient, moderate complexity",
     "confidence": "medium", "needs_review": true},
    {"description": "Radiologic exam, knee, 3 views, right", "code": "73562",
     "evidence_quote": "Radiologic exam, knee, 3 views, right", "confidence": "medium", "needs_review": true},
    {"description": "Knee immobilizer fitting", "code": "29515",
     "evidence_quote": "Knee immobilizer fitting", "confidence": "low", "needs_review": true}
  ],
  "needs_review": true
}
```

Screenshot: run the app locally with the command above — the sidebar lets
you toggle backend and document, and results render live below the upload.

## Limitations

- **Illustrative codes, not certified coding.** ICD-10/CPT suggestions are
  a hackathon demo, not a certified coding determination — a human coder
  should review every flagged (and honestly, every unflagged) line before
  any billing use.
- **Local backend reliability varies by model size.** Small local vision
  models (e.g. `moondream`, ~1.7GB) largely fail to read dense document
  text and hallucinate content instead. A larger local model (`llava`,
  ~4.7GB) reads real content but is noticeably less reliable at both
  following the JSON schema and picking correct codes than the cloud
  model — this tradeoff (free + private vs. accurate + structured) is
  itself one of the report's discussion points.
- **Synthetic data only.** The bundled documents are fabricated for this
  demo; real-world scans (true camera photos, wrinkled paper, handwriting)
  would be harder than the rendered samples here.
- **No persistence.** Nothing is saved between runs — this is a POC, not a
  production intake system.
