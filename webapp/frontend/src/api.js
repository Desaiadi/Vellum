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

export async function sendChat(message, history) {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  const data = await handle(res);
  return data.reply;
}
