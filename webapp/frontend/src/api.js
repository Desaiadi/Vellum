const BASE = "/api";

async function handle(res) {
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export async function listSamples() {
  const res = await fetch(`${BASE}/samples`);
  const data = await handle(res);
  return data.samples;
}

export function sampleUrl(name) {
  return `${BASE}/samples/${encodeURIComponent(name)}`;
}

export async function extract({ file, sample, backend, pipeline, deid }) {
  const form = new FormData();
  if (file) form.append("file", file);
  if (sample) form.append("sample", sample);
  form.append("backend", backend);
  form.append("pipeline", pipeline);
  form.append("deid", String(deid));
  const res = await fetch(`${BASE}/extract`, { method: "POST", body: form });
  return handle(res);
}

export async function extractBatch({ files, backend, pipeline, deid }) {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  form.append("backend", backend);
  form.append("pipeline", pipeline);
  form.append("deid", String(deid));
  const res = await fetch(`${BASE}/extract/batch`, { method: "POST", body: form });
  const data = await handle(res);
  return data.results;
}

export async function getReportSummary() {
  const res = await fetch(`${BASE}/report/summary`);
  const data = await handle(res);
  return data.summary;
}

export async function explainSnippet(text) {
  const res = await fetch(`${BASE}/report/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await handle(res);
  return data.explanation;
}

function docForm({ file, text }, fileField = "file", textField = "text") {
  const form = new FormData();
  if (file) form.append(fileField, file);
  else form.append(textField, text || "");
  return form;
}

export async function summarizeContent({ file, text, docType }) {
  const form = docForm({ file, text });
  form.append("doc_type", docType);
  const res = await fetch(`${BASE}/content/summarize`, { method: "POST", body: form });
  return handle(res);
}

export async function compareContent({ fileA, textA, fileB, textB }) {
  const form = new FormData();
  if (fileA) form.append("file_a", fileA);
  else form.append("text_a", textA || "");
  if (fileB) form.append("file_b", fileB);
  else form.append("text_b", textB || "");
  const res = await fetch(`${BASE}/content/compare`, { method: "POST", body: form });
  return handle(res);
}

export async function contentToRules({ file, text, target }) {
  const form = docForm({ file, text });
  form.append("target", target);
  const res = await fetch(`${BASE}/content/to-rules`, { method: "POST", body: form });
  return handle(res);
}

export async function explainRecord({ file, text }) {
  const res = await fetch(`${BASE}/record/explain`, {
    method: "POST",
    body: docForm({ file, text }),
  });
  return handle(res);
}

export async function consultRecord({ question, recordText, history }) {
  const res = await fetch(`${BASE}/record/consult`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, record_text: recordText, history }),
  });
  const data = await handle(res);
  return data.reply;
}

export async function sendChat(message, history) {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  const data = await handle(res);
  return data.reply;
}
