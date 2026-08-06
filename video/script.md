# Vellum — Video Recording Script

Target: **under 5 minutes total**. Camera on for intro/outro, slides for the
middle, screen-share for the live demo. Rehearse once before recording —
the timings below assume a normal speaking pace, not rushed.

## Recording checklist

- [ ] Camera + mic on, framed and lit (webcam or phone at eye level)
- [ ] `Vellum_Presentation.pptx` open in presenter view
- [ ] Terminal + browser ready: `cd poc && source venv/bin/activate && streamlit run app.py`
- [ ] Sidebar set to **Claude API** backend, `superbill_2_degraded.png` picked as the sample, page NOT yet run (so the click happens live on camera)
- [ ] Screen recording software ready (QuickTime "New Screen Recording", or Zoom local recording) with the webcam overlay enabled if your tool supports it — otherwise record camera separately and stitch, or just do slides+demo screen-share with voiceover and a short camera-on intro/outro

## Run of show

**0:00–0:20 — On camera, intro**
> "Hi, I'm Aditya Desai. For the Cotiviti Clinical NLP track, I built Vellum — a
> chart coding assistant that shows exactly how a single multimodal model can
> replace a whole OCR-and-NLP pipeline. Let me walk through it."

**0:20–2:00 — Slides (switch to screen-share)**
Move fast — one or two sentences per slide, matching what's on screen:

| Slide | Say |
|---|---|
| 1. Title | (skip narration, just show it 2 sec) |
| 2. The Concept | "Clinical NLP spans four capabilities — NLP, OCR, computer vision, and now large multimodal models — that turn documents like this into usable data." |
| 3. Past → Present → Future | "The field moved from rule-based pipelines, to today's OCR-plus-LLM pipelines, toward a single multimodal model reading the document directly." |
| 4. The Reliability Gap | "That present-day approach has real, measured problems — even GPT-4 only agrees with certified coders 15% of the time on ICD-10 extraction." |
| 5. Collapsing the Pipeline | "Vellum's core idea: replace that three-stage pipeline with one multimodal call that outputs structured JSON with confidence scores and review flags." |
| 6. Introducing Vellum | "Here's what it does — structured extraction, confidence and review flags, two backends, and documents at varying scan quality." |
| 7. Vellum in Action | "This is real output from the degraded sample scan — correct codes, and it correctly flags the lower-confidence procedure lines." |
| 8. Cloud vs. Local | "I also tested a fully offline backend. The small local model hallucinates; the larger one reads real content but is less reliable — a genuine, tested tradeoff." |
| 9. Opportunities & Threats | "For Cotiviti specifically: real market tailwind, but real reliability risk that can't be automated away yet." |
| 10. Recommendation | "My recommendation: pilot this human-in-the-loop, and gate any expansion on measured accuracy, not vendor claims." |

**2:00–4:20 — Live demo (screen-share, terminal + browser)**
1. Show the running Streamlit app already loaded with `superbill_2_degraded.png`
   selected. Point out the sidebar: backend selector, document picker.
2. Click **Extract structured record** live. While it runs (~8–10s), talk over
   it: "This is one API call to Claude, sending the image directly — no OCR
   step at all."
3. Walk through the result on screen: patient/provider/date fields, then the
   diagnoses and procedures. Point at the confidence badges and the two
   `needs review` flags. Read the record-level banner: "flagged for human
   review before any billing use."
4. Check **Also run classic OCR pipeline (comparison)** and re-run, or switch
   to a clean sample and point out the OCR'd-text expander — "this is what the
   single call replaces: a separate OCR pass feeding a second LLM call."
5. (Optional, if time allows) Toggle the backend to **Local Ollama** and show
   it running fully offline — even if the local model's output is visibly
   weaker, that's the honest point: free and private today trades off
   reliability.

**4:20–4:50 — On camera, wrap-up**
> "So: Vellum proves the concept — one multimodal call can replace a
> multi-stage pipeline — while being honest that today's models, cloud or
> local, aren't accurate enough for full automation yet. My recommendation to
> Cotiviti is to pilot this human-in-the-loop, on the highest-volume, lowest-
> risk documents first. Thanks for watching."

**4:50–5:00 — buffer**

## After recording

- Trim dead air at start/end.
- Export as `.mp4` (H.264), keep it under the 5-minute limit.
- Save the final file as `video/Vellum_Demo.mp4` in this repo.
