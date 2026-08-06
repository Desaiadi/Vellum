"""Vellum — Clinical Chart Coding Assistant (Streamlit demo).

Primary flow: a single multimodal model reads a clinical billing document
(superbill / discharge summary) image and extracts a full structured record —
patient, provider, dates, diagnoses (ICD-10), procedures (CPT) — with
per-field confidence and a needs_review flag, in one pass. This replaces the
conventional OCR -> NER -> code-normalization pipeline, which is available
below as an optional side-by-side comparison.

Both pipelines can run against either backend: Claude API (cloud) or a local
Ollama model (offline, free).
"""

from pathlib import Path

import streamlit as st
from PIL import Image

import config
from pipelines import classic_pipeline, multimodal_pipeline

SAMPLE_DIR = Path(__file__).parent / "sample_data"
CONF_COLOR = {"high": "green", "medium": "orange", "low": "red"}

st.set_page_config(page_title="Vellum — Clinical Chart Coding Assistant", layout="wide")

st.title("Vellum")
st.caption(
    "One multimodal model reads a clinical billing document and extracts a "
    "structured, coded record — no OCR, no separate NER pipeline."
)

with st.sidebar:
    st.header("Settings")
    backend = st.radio(
        "Inference backend",
        options=list(config.BACKENDS.keys()),
        format_func=lambda k: config.BACKENDS[k],
        index=0,
    )
    if backend == "claude":
        st.caption(f"Model: `{config.CLAUDE_MODEL}`")
        if not config.ANTHROPIC_API_KEY:
            st.error("ANTHROPIC_API_KEY not set — add it to poc/.env")
    else:
        st.caption(
            f"Text model: `{config.OLLAMA_TEXT_MODEL}`  \n"
            f"Vision model: `{config.OLLAMA_VISION_MODEL}`"
        )
        st.caption("Requires `ollama serve` running locally with these models pulled.")

    st.divider()
    st.header("Document")
    sample_files = sorted(SAMPLE_DIR.glob("*.png"))
    sample_options = ["(upload my own)"] + [f.name for f in sample_files]
    preselect = st.query_params.get("sample")
    default_index = sample_options.index(preselect) if preselect in sample_options else 0
    sample_choice = st.selectbox(
        "Use a sample document",
        options=sample_options,
        index=default_index,
    )
    uploaded = st.file_uploader("...or upload an image", type=["png", "jpg", "jpeg"])

    st.divider()
    show_comparison = st.checkbox(
        "Also run classic OCR pipeline (comparison)",
        value=False,
        help="Runs OCR + a text-only LLM call side by side, to show what the "
        "single multimodal call replaces.",
    )

image = None
if uploaded is not None:
    image = Image.open(uploaded).convert("RGB")
elif sample_choice != "(upload my own)":
    image = Image.open(SAMPLE_DIR / sample_choice).convert("RGB")

if image is None:
    st.info("Pick a sample document or upload an image from the sidebar to get started.")
    st.stop()

col_img, col_run = st.columns([2, 1])
with col_img:
    st.image(image, caption="Input document", width=420)
with col_run:
    st.write("")
    st.write("")
    run = st.button("Extract structured record", type="primary", use_container_width=True)

if not run:
    st.stop()


def render_field(label: str, value: str, confidence: str) -> str:
    color = CONF_COLOR.get(confidence, "gray")
    return f"**{label}:** {value} &nbsp; :{color}[{confidence}]"


def render_code_table(items: list, code_label: str) -> None:
    if not items:
        st.caption("None found.")
        return
    for item in items:
        color = CONF_COLOR.get(item.get("confidence", ""), "gray")
        flag = " 🚩 **needs review**" if item.get("needs_review") else ""
        st.markdown(
            f"- **{item.get('description', '?')}** — `{code_label}: {item.get('code', 'N/A')}` "
            f":{color}[{item.get('confidence', '?')}]{flag}"
        )
        st.caption(f"　Evidence: “{item.get('evidence_quote', '')}”")


def render_record(result) -> None:
    st.subheader(result.pipeline_name)
    st.caption(f"Backend: {config.BACKENDS[result.backend]} · {result.elapsed_seconds:.1f}s")
    if result.error:
        st.error(result.error)
        return
    if result.ocr_text is not None:
        with st.expander("OCR'd text (input to the LLM)"):
            st.text(result.ocr_text)

    record = result.record
    if record.get("needs_review"):
        st.warning("🚩 This record has one or more fields flagged for human review.")

    p = record["patient"]
    prov = record["provider"]
    d = record["dates"]
    st.markdown(render_field("Patient", f"{p['name']} (DOB {p['dob']}, MRN {p['mrn']})", p["confidence"]))
    st.markdown(render_field("Provider", f"{prov['name']} ({prov['identifier']})", prov["confidence"]))
    st.markdown(render_field("Date of service", d["date_of_service"], d["confidence"]))

    st.markdown("**Diagnoses (ICD-10)**")
    render_code_table(record["diagnoses"], "ICD-10")
    st.markdown("**Procedures (CPT)**")
    render_code_table(record["procedures"], "CPT")


with st.spinner("Extracting structured record (single multimodal call)..."):
    mm_result = multimodal_pipeline(image, backend)
render_record(mm_result)

if show_comparison:
    st.divider()
    st.markdown("### Comparison: conventional OCR + text-LLM pipeline")
    with st.spinner("Running classic OCR + text-LLM pipeline..."):
        classic_result = classic_pipeline(image, backend)
    render_record(classic_result)

    if not classic_result.error and not mm_result.error:
        st.caption(
            f"Multimodal: {mm_result.elapsed_seconds:.1f}s (1 call) · "
            f"Classic: {classic_result.elapsed_seconds:.1f}s (OCR + 1 call)"
        )
