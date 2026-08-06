# Clinical Natural Language Technology for Health Care: Past, Present, and Future Approaches

*Cotiviti Intern Assessment — Aditya Desai*

## The Concept

Clinical Natural Language Technology spans the tools that turn unstructured clinical documentation — typed notes, scanned forms, billing superbills, discharge summaries — into structured, usable data. It sits at the intersection of four capabilities: Natural Language Processing (NLP) to parse and understand clinical text, Optical Character Recognition (OCR) to digitize scanned or handwritten documents, Computer Vision (CV) to interpret document layout and image quality, and, increasingly, Large and Large Multimodal Models (LLM/LMM) that reason over text and images jointly rather than as separate stages. For a payment-integrity company, this technology sits directly upstream of claims auditing: every coding error, missed diagnosis, or misread procedure that enters the pipeline at intake compounds downstream.

## Trends: Past, Present, and Future

### Past — Rule-Based Pipelines

Early clinical NLP relied on hand-crafted rules, dictionaries, and pattern matching, later supplemented by traditional machine learning (hidden Markov models, conditional random fields) for named-entity recognition. Rule-based method usage peaked around 2011 and declined as machine-learning approaches matured (Wu et al., 2022). OCR in this era was template-dependent and brittle: documents that deviated from an expected layout produced high error rates.

### Present — Multi-Stage Pipelines Bolted to LLMs

Today's default architecture chains a separate OCR stage to a general-purpose LLM: OCR extracts raw text, then the LLM performs entity extraction and code lookup. Modern cloud OCR now reaches roughly 95–99% character accuracy on clean scans (Bhatnagar, 2025), and LLMs are increasingly used for ICD-10 coding assistance. But benchmarks show this is far from solved: a 2025 evaluation of six leading LLMs extracting ICD-10-CM codes from real inpatient notes found poor concordance against certified human coders, with even the best-performing model (GPT-4) reaching only 15.2% agreement, and common failure modes including hallucinated diagnoses and coding unconfirmed conditions (Simmons et al., 2025). Separately, foundation models used for clinical text generation show a measured hallucination rate of 1.47% across thousands of clinician-annotated sentences — low-looking in isolation, but consequential at claims-processing scale (Kim et al., 2025).

### Future — Single-Model Multimodal Understanding

The emerging approach collapses the OCR-then-LLM pipeline into a single multimodal call: a vision-capable model reads the document image directly, reasoning jointly over layout, handwriting, and text rather than losing information at a brittle OCR handoff. Purpose-built medical vision-language models are an active 2026 research area (Guasch-Martí et al., 2026), and the practical direction — confirmed hands-on in this project's proof of concept — is not full automation but confidence-scored extraction with explicit human-review flags on uncertain fields, paired with a parallel move toward on-device inference for cost and data-locality reasons, even though today's small local models trade away significant structured-output reliability to get there.

## Opportunities and Threats

### Opportunities

- Faster, cheaper document intake: a single multimodal call replaces a multi-stage OCR/NER/normalization pipeline, reducing both latency and the engineering surface area to maintain.
- Market tailwind: the healthcare payment-integrity market is projected to grow from $17.06B in 2026 to $31.25B by 2031 (12.86% CAGR), driven partly by a persistent 6.26% claims-error rate industry-wide (Grigalashvili, 2026) — real demand for tools that catch errors earlier and cheaper.
- Confidence scoring and needs-review flags map directly onto the industry's shift from reactive post-payment audits toward pre-payment, prevention-first review (Starman, 2025), giving human coders a prioritized queue instead of a blind stack.

### Threats

- Low concordance with certified coders even on frontier models means full automation is not viable today; unreviewed LLM output risks both false claims and missed revenue (Simmons et al., 2025).
- Hallucinated clinical content can silently enter documentation and compound over time if not caught at intake (Kim et al., 2025).
- Small, low-cost local models are not yet a substitute for frontier cloud models on this task — a cost-driven bet on local-only inference risks a real accuracy regression, a tradeoff this project's proof of concept demonstrates directly rather than assumes.
- PHI passes through whatever backend reads the document — a real compliance surface, addressed in this project's proof of concept with a structured-output de-identification option (though note it de-identifies the extracted record, not the source image sent to the model — see the project's "what it doesn't do" notes).

## Strategic Recommendation for Cotiviti

Pilot a human-in-the-loop, multimodal document-intake copilot — structured extraction with mandatory per-field confidence scores and review flags, not autonomous coding — starting on high-volume, lower-risk document types (e.g. superbills) before expanding to more complex discharge summaries. Pair this with a standing internal benchmark, modeled on Simmons et al.'s (2025) evaluation methodology, that continuously measures model concordance against certified coders and gates any expansion of automation scope on measured accuracy thresholds rather than vendor claims. This keeps Cotiviti positioned at the leading edge of payment-integrity automation while treating today's genuine reliability gap as a measured constraint, not an afterthought.

## References

- Bhatnagar, K. (2025, February 18). OCR for medical records management: How OCR technology is redefining efficiency in medical records digitization. Docsumo.
- Grigalashvili, E. (2026, April 3). Healthcare payment integrity companies: Best providers in 2026. Helpware.
- Guasch-Martí, J., Lopez-Cuena, E., Suárez-Fernández, M., Bayarri-Planas, J., Arias-Duart, A., & Garcia-Gasulla, D. (2026). Aloe-Vision: Robust vision-language models for healthcare (arXiv:2606.27500).
- Kim, Y., Jeong, H., Chen, S., Li, S. S., et al. (2025). Medical hallucinations in foundation models and their impact on healthcare (arXiv:2503.05777).
- Simmons, A., Takkavatakarn, K., McDougal, M., et al. (2025). Extracting International Classification of Diseases codes from clinical documentation using large language models. Applied Clinical Informatics, 16(2), 337–344.
- Starman, R. (2025, October 28). The future of payment integrity: Navigating challenges, embracing opportunities. HIT Consultant.
- Wu, H., Wang, M., Wu, J., et al. (2022). A survey on clinical natural language processing in the United Kingdom from 2007 to 2022. npj Digital Medicine, 5, Article 186.
