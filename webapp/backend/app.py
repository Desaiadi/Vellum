"""Vellum backend — Flask API.

Thin route layer. All extraction logic lives in pipelines.py (ported
unchanged from the original Streamlit POC), de-identification in deid.py,
chat in chatbot.py, and report summarization in report_summary.py.
"""

from dataclasses import asdict

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from PIL import Image

import chatbot
import config
import content_tools
import deid
import record_explainer
import report_summary
from fileio import extract_text, open_document_image
from pipelines import classic_pipeline, multimodal_pipeline

app = Flask(__name__)
CORS(app)


def _result_to_json(result, include_deid: bool) -> dict:
    payload = asdict(result)
    if include_deid and not result.error:
        payload["deidentified_record"] = deid.deidentify_record(result.record)
    return payload


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/api/samples")
def list_samples():
    files = sorted(p.name for p in config.SAMPLE_DIR.glob("*.png"))
    return jsonify({"samples": files})


@app.get("/api/samples/<path:name>")
def get_sample(name):
    return send_from_directory(config.SAMPLE_DIR, name)


def _load_upload_image():
    if "file" not in request.files:
        raise ValueError("No file uploaded (expected multipart field 'file').")
    return open_document_image(request.files["file"])


def _load_sample_image(sample_name: str):
    return Image.open(config.SAMPLE_DIR / sample_name).convert("RGB")


def _resolve_image():
    if "file" in request.files:
        return _load_upload_image()
    sample_name = request.form.get("sample")
    if sample_name:
        return _load_sample_image(sample_name)
    raise ValueError("No image provided — send a file or a 'sample' name.")


@app.post("/api/extract")
def extract():
    try:
        image = _resolve_image()
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400

    backend = request.form.get("backend", "claude")
    pipeline = request.form.get("pipeline", "multimodal")
    include_deid = request.form.get("deid", "false").lower() == "true"

    fn = classic_pipeline if pipeline == "classic" else multimodal_pipeline
    result = fn(image, backend)
    return jsonify(_result_to_json(result, include_deid))


@app.post("/api/extract/batch")
def extract_batch():
    backend = request.form.get("backend", "claude")
    pipeline = request.form.get("pipeline", "multimodal")
    include_deid = request.form.get("deid", "false").lower() == "true"

    files = request.files.getlist("files")
    if not files:
        return jsonify({"error": "No files uploaded (expected multipart field 'files')."}), 400

    fn = classic_pipeline if pipeline == "classic" else multimodal_pipeline
    results = []
    for f in files:
        try:
            image = open_document_image(f)
            result = fn(image, backend)
            payload = _result_to_json(result, include_deid)
        except Exception as exc:  # keep batch going even if one file is bad
            payload = {"error": str(exc)}
        payload["filename"] = f.filename
        results.append(payload)
    return jsonify({"results": results})


@app.get("/api/report/summary")
def report_summary_route():
    try:
        return jsonify({"summary": report_summary.get_summary()})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.post("/api/report/explain")
def report_explain_route():
    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "No 'text' provided to explain."}), 400
    try:
        return jsonify({"explanation": report_summary.explain(text)})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


def _text_from_request(text_field="text", file_field="file"):
    """Accept either pasted text or an uploaded document."""
    if file_field in request.files and request.files[file_field].filename:
        return extract_text(request.files[file_field])
    pasted = (request.form.get(text_field) or "").strip()
    if not pasted and request.is_json:
        pasted = ((request.get_json(silent=True) or {}).get(text_field) or "").strip()
    if not pasted:
        raise ValueError("Provide a document to upload, or paste the text in.")
    return pasted


# --------------------------------------------------------------------------
# Content management — policies, guidelines, contracts
# --------------------------------------------------------------------------


@app.post("/api/content/summarize")
def content_summarize():
    try:
        text = _text_from_request()
        doc_type = request.form.get("doc_type", "other")
        return jsonify(content_tools.summarize(text, doc_type))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.post("/api/content/compare")
def content_compare():
    try:
        if "file_a" in request.files and request.files["file_a"].filename:
            text_a = extract_text(request.files["file_a"])
        else:
            text_a = (request.form.get("text_a") or "").strip()
        if "file_b" in request.files and request.files["file_b"].filename:
            text_b = extract_text(request.files["file_b"])
        else:
            text_b = (request.form.get("text_b") or "").strip()
        if not text_a or not text_b:
            return jsonify({"error": "Provide both versions to compare."}), 400
        return jsonify(content_tools.compare(text_a, text_b))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.post("/api/content/to-rules")
def content_to_rules():
    try:
        text = _text_from_request()
        target = request.form.get("target", "rules_json")
        return jsonify(content_tools.to_rules(text, target))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# --------------------------------------------------------------------------
# Patient record explainer
# --------------------------------------------------------------------------


@app.post("/api/record/explain")
def record_explain():
    try:
        text = _text_from_request()
        result = record_explainer.explain(text)
        result["source_text"] = text
        return jsonify(result)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.post("/api/record/consult")
def record_consult():
    data = request.get_json(force=True, silent=True) or {}
    question = (data.get("question") or "").strip()
    record_text = (data.get("record_text") or "").strip()
    history = data.get("history", [])
    if not question or not record_text:
        return jsonify({"error": "Both 'question' and 'record_text' are required."}), 400
    try:
        return jsonify({"reply": record_explainer.consult(question, record_text, history)})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.post("/api/chat")
def chat_route():
    data = request.get_json(force=True, silent=True) or {}
    message = data.get("message", "").strip()
    history = data.get("history", [])
    if not message:
        return jsonify({"error": "No 'message' provided."}), 400
    try:
        reply = chatbot.chat(message, history)
        return jsonify({"reply": reply})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    app.run(port=5001, debug=True)
