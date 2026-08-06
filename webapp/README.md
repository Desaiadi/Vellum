# Vellum Web App — Flask + React

The flagship version of Vellum: a Flask API backend and a React (Vite +
Tailwind) frontend, built on top of the same extraction logic as the
original Streamlit POC (`poc/`, kept as a lightweight fallback).

## What's new here vs. `poc/`

- Real web UI (React + Tailwind) instead of Streamlit.
- **Batch upload** with a review-queue worklist and an **analytics dashboard**
  (needs-review rate, confidence distribution) computed over whatever's been
  processed in the session — no database, results live in browser state.
- **De-identified view** — a toggle that tokenizes patient name/DOB/MRN in
  the *extracted structured output* for downstream/analytics use. This does
  **not** redact the source document image before it's sent to a model —
  the multimodal pipeline works by having the model read the image
  directly, so it necessarily sees whatever PHI is in that image. Stated
  here plainly so the feature isn't oversold.
- **Plain-English report summary** ("About the Report" tab) — a cached,
  jargon-free rewrite of `report/Vellum_Report.docx`, plus an inline
  **"explain"** action on every diagnosis/procedure line.
- **Grounded chatbot** (bottom-right) that answers questions about the
  project, the report, and the builder's background. It's "RAG-lite": the
  report + project description + builder profile (all in
  `backend/knowledge/`) are small enough to include in full in the system
  prompt on every request, rather than chunked into a vector store. At this
  corpus size that's simpler and more reliably grounded than retrieval — a
  deliberate substitution, not a shortcut.

## Setup

```bash
# Backend
cd webapp/backend
python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
brew install tesseract   # OCR engine, needed for the comparison pipeline
cp .env.example .env     # paste your ANTHROPIC_API_KEY into .env

# Frontend (separate terminal)
cd webapp/frontend
npm install
```

## Run

```bash
# Terminal 1 — backend, port 5001
cd webapp/backend && source venv/bin/activate && FLASK_APP=app.py flask run --port 5001

# Terminal 2 — frontend, port 5173 (proxies /api to :5001, see vite.config.js)
cd webapp/frontend && npm run dev
```

Open http://localhost:5173.

### Optional: local/offline backend

Same as `poc/` — `brew install ollama && ollama serve`, then
`ollama pull llava` and `ollama pull llama3.2:1b`, and pick "Local Ollama"
in the sidebar.

## Backend API

| Route | Method | Purpose |
|---|---|---|
| `/api/health` | GET | liveness check |
| `/api/samples` | GET | list bundled sample documents |
| `/api/samples/<name>` | GET | serve a sample image |
| `/api/extract` | POST | multipart `file` or `sample` + `backend` + `pipeline` (`classic`\|`multimodal`) + `deid` → structured record |
| `/api/extract/batch` | POST | multipart `files[]` + same params → array of per-file results |
| `/api/report/summary` | GET | cached plain-English report summary |
| `/api/report/explain` | POST | `{text}` → plain-English explanation of that snippet |
| `/api/chat` | POST | `{message, history}` → grounded chat reply |

## Notes

- `backend/sample_data` is a symlink to `../../poc/sample_data` — one set of sample documents, no duplication.
- `backend/.env` is git-ignored, same as `poc/.env`.
- Batch/analytics state is session-only (React state, no database) — a real deployment would persist this.
