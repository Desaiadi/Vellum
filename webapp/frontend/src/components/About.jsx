import { useEffect, useState } from "react";
import {
  Boxes,
  ChevronDown,
  CircuitBoard,
  Cloud,
  Code2,
  FileScan,
  FlaskConical,
  HardDrive,
  Layers,
  Loader2,
  Plug,
  ScrollText,
  ShieldAlert,
  Split,
  Stethoscope,
} from "lucide-react";
import { ArchitectureDiagram, FlowDiagram, StageComparisonDiagram } from "./AboutDiagrams";
import { getReportSummary } from "../api";

/* ----------------------------- content ----------------------------- */

const WORKSPACES = [
  {
    id: "extract",
    label: "Extract",
    icon: FileScan,
    endpoint: "POST /api/extract",
    blurb:
      "The core pipeline. One multimodal call turns a superbill or discharge summary into a structured record — patient, provider, date of service, ICD-10 diagnoses, CPT procedures — with a confidence level on every field and a needs_review flag on anything ambiguous.",
    steps: [
      { label: "Upload", sub: "PNG · JPG · PDF" },
      { label: "Normalise", sub: "PDF → image, 200 DPI" },
      { label: "Multimodal call", sub: "schema-pinned JSON" },
      { label: "Record", sub: "+ confidence + flags" },
    ],
    note: "The optional comparison path inserts a Tesseract OCR stage and calls a text-only model instead.",
    detail: [
      ["Schema enforcement", "The extraction shape is pinned with structured outputs, so the JSON contract is guaranteed by the API rather than parsed and hoped for."],
      ["Evidence quotes", "Every code line carries the verbatim phrase it was drawn from, which is what makes a reviewer able to check it in seconds."],
      ["De-identification", "An optional pass tokenises patient name, DOB, and MRN in the returned record — see the tradeoffs section for what that does and does not cover."],
    ],
  },
  {
    id: "batch",
    label: "Batch",
    icon: Layers,
    endpoint: "POST /api/extract/batch",
    blurb:
      "The same extraction over a stack of documents, returned as a review queue. One bad file does not kill the run — failures are captured per-document and surfaced in the queue alongside the successes.",
    steps: [
      { label: "Multi-upload", sub: "any number of files" },
      { label: "Per-file loop", sub: "errors isolated" },
      { label: "Queue", sub: "flagged records first" },
      { label: "Analytics", sub: "computed client-side" },
    ],
    note: "Results live in React state for the session — there is no database, by design.",
    detail: [
      ["Failure isolation", "Each document is processed in its own try/except so a corrupt file returns an error row instead of failing the batch."],
      ["Aggregate view", "Needs-review rate and confidence distribution are derived in the browser from whatever has been processed so far."],
      ["Honest scope", "A production version would persist this. For a demo, session state keeps the moving parts down."],
    ],
  },
  {
    id: "policy",
    label: "Policy",
    icon: ScrollText,
    endpoint: "POST /api/content/{summarize | compare | to-rules}",
    blurb:
      "Content management for billing policies, clinical practice guidelines, and payer–provider contracts. Three tools: summarize a document, diff two versions semantically, or convert written policy into logic you can actually run.",
    steps: [
      { label: "Upload / paste", sub: "PDF · image · text" },
      { label: "Text extraction", sub: "text layer or OCR" },
      { label: "Structured call", sub: "per-task schema" },
      { label: "Rules + code", sub: "JSON · Python · SQL" },
    ],
    note: "The diff is semantic, not textual — it ignores renumbering and formatting churn.",
    detail: [
      ["Materiality, not just deltas", "Each change carries its practical impact and a high/medium/low materiality rating, so a reviewer reads the consequential ones first."],
      ["Traceable rules", "Every generated rule keeps its source quote and a confidence level, so the logic can be audited back to the sentence it came from."],
      ["Refuses to invent", "Where the policy is too vague to encode — an undefined 'contraindication', an unstated threshold — it says so in caveats instead of fabricating a number."],
    ],
  },
  {
    id: "record",
    label: "My Record",
    icon: Stethoscope,
    endpoint: "POST /api/record/{explain | consult}",
    blurb:
      "Patient-facing. A lab report or medical record explained in plain language — what each result measures, what that value generally indicates, what could explain the pattern, and what to ask a clinician — plus a follow-up chat grounded in the uploaded document.",
    steps: [
      { label: "Upload / paste", sub: "lab report · record" },
      { label: "Text extraction", sub: "text layer or OCR" },
      { label: "Explainer call", sub: "constrained prompt" },
      { label: "Explanation", sub: "+ urgency + questions" },
    ],
    note: "The follow-up chat re-sends the document each turn, so answers stay tied to the source.",
    detail: [
      ["Educational, not diagnostic", "The prompt forbids diagnosing the user or advising any treatment change, and requires possibilities to be framed as things a clinician would consider."],
      ["Escalates rather than reassures", "If anything reads as time-sensitive it must say so plainly and raise the urgency level — the failure mode being designed against is false comfort."],
      ["Named uncertainty", "Where the document is unclear or incomplete, it is required to say so instead of filling the gap."],
    ],
  },
];

const STACK = [
  {
    icon: Code2,
    group: "Frontend",
    items: ["React 19", "Vite 8", "Tailwind CSS 4", "lucide-react", "react-markdown"],
  },
  {
    icon: CircuitBoard,
    group: "Backend",
    items: ["Python 3.14", "Flask 3", "flask-cors", "python-dotenv"],
  },
  {
    icon: Cloud,
    group: "Cloud inference",
    items: ["Anthropic SDK", "claude-sonnet-5", "Structured outputs (JSON schema)"],
  },
  {
    icon: HardDrive,
    group: "Local inference",
    items: ["Ollama", "llava (vision, 7B)", "llama3.2:1b (text)", "zero marginal cost"],
  },
  {
    icon: FileScan,
    group: "Document processing",
    items: ["PyMuPDF (PDF)", "Tesseract (OCR)", "Pillow (imaging)"],
  },
  {
    icon: FlaskConical,
    group: "Sample data",
    items: ["Synthetic superbills", "Synthetic discharge summary", "3 scan-quality tiers"],
  },
];

const ENDPOINTS = [
  ["GET", "/api/health", "Liveness check"],
  ["GET", "/api/samples", "List bundled sample documents"],
  ["POST", "/api/extract", "Single document → structured record"],
  ["POST", "/api/extract/batch", "Many documents → review queue"],
  ["POST", "/api/content/summarize", "Policy → summary, obligations, codes"],
  ["POST", "/api/content/compare", "Two versions → semantic diff + materiality"],
  ["POST", "/api/content/to-rules", "Policy → rules, code, inputs, caveats"],
  ["POST", "/api/record/explain", "Record → plain-language explanation"],
  ["POST", "/api/record/consult", "Grounded follow-up Q&A"],
  ["GET", "/api/report/summary", "Cached plain-English report summary"],
  ["POST", "/api/chat", "Site assistant, grounded in the corpus"],
];

const DECISIONS = [
  {
    icon: Split,
    q: "Why context-stuffing instead of a vector database?",
    a: "The grounding corpus — the written report, a project description, and a profile — is about 4K tokens. At that size, putting the whole thing in the system prompt is strictly more reliable than chunk-and-retrieve, because there is no retrieval step that can miss the relevant passage. It also removes an embedding store, a chunking strategy, and a similarity threshold from the system. A vector database earns its place when the corpus stops fitting in context; this one does not. Calling that 'RAG' would overstate it, so it is labelled RAG-lite wherever it appears.",
  },
  {
    icon: ShieldAlert,
    q: "What does de-identification actually cover?",
    a: "It tokenises patient name, DOB, and MRN in the extracted structured record, for downstream use where raw identifiers are not needed. It does not redact the source image before that image is sent to a model — the multimodal approach works precisely by having the model read the page, so it necessarily sees whatever is on it. That limit is stated in the UI, the README, and the report rather than papered over, because a de-identification feature that quietly fails to de-identify is worse than none.",
  },
  {
    icon: HardDrive,
    q: "Why ship a local backend that performs worse?",
    a: "Because the comparison is the finding. A small local vision model (moondream, ~1.7GB) largely fails to read dense document text and hallucinates content instead. A larger one (llava 7B) reads real content but is noticeably less reliable at both honouring the JSON schema and picking correct codes. That cost-versus-accuracy tradeoff is one of the report's central claims, and it is more credible demonstrated live than asserted in prose.",
  },
  {
    icon: Boxes,
    q: "Why is there no database?",
    a: "Nothing in the demo needs durable state, and adding Postgres would have meant migrations, connection handling, and a deployment story for zero demonstrated capability. Batch results live in React state for the session. A production deployment would persist them — the point of naming this is that it is a scoping decision, not an oversight.",
  },
  {
    icon: Plug,
    q: "Why keep the old Streamlit version in the repo?",
    a: "The assessment rewards proving a concept quickly. poc/ is the original build — one file of UI, the same extraction logic — and it still runs. This web app is the flagship, but the smaller version is honest evidence of what the concept needed at minimum, and the shared pipelines.py is what made growing from one to the other cheap.",
  },
];

const LIMITS = [
  "ICD-10 and CPT suggestions are illustrative for a demo, not a certified coding determination.",
  "De-identification applies to the extracted record, not to the source image sent to the model.",
  "Multi-page PDFs are read from page one only in the extraction pipeline.",
  "Batch results and analytics are session-scoped; nothing is persisted.",
  "Sample documents are synthetic. Nothing here has been validated against real, HIPAA-covered records.",
  "Local-model output is measurably less reliable than cloud on this task, and is shipped to show that rather than to recommend it.",
];

/* ----------------------------- pieces ----------------------------- */

function Section({ eyebrow, title, lead, children }) {
  return (
    <section className="mt-16">
      <span className="text-xs font-bold uppercase tracking-widest text-amber-dark">{eyebrow}</span>
      <h2 className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">{title}</h2>
      {lead && <p className="mt-2.5 max-w-3xl text-[15px] leading-relaxed text-gray-600">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Accordion({ item, open, onToggle }) {
  const Icon = item.icon;
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-gray-50/70"
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
            open ? "bg-navy text-white" : "bg-navy/5 text-navy"
          }`}
        >
          <Icon size={17} />
        </span>
        <span className="flex-1 font-semibold text-navy">{item.q}</span>
        <ChevronDown
          size={17}
          className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="animate-fade border-t border-gray-100 px-5 py-4 pl-[4.25rem] text-sm leading-relaxed text-gray-600">
          {item.a}
        </p>
      )}
    </div>
  );
}

function ReportFindings() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReportSummary()
      .then(setSummary)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-black/5">
      {loading && (
        <p className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 size={14} className="animate-spin" /> Summarizing the report…
        </p>
      )}
      {error && <p className="text-sm text-bad">{error}</p>}
      {summary && (
        <div className="space-y-4 whitespace-pre-line text-[15px] leading-relaxed text-gray-700">
          {summary}
        </div>
      )}
      <p className="mt-6 border-t border-gray-100 pt-4 text-xs text-gray-400">
        Generated from <code className="rounded bg-gray-100 px-1">report/Vellum_Report.docx</code>,
        the written deliverable in this repository. Full citations are on its bibliography page.
      </p>
    </div>
  );
}

/* ----------------------------- page ----------------------------- */

export default function About() {
  const [tab, setTab] = useState("extract");
  const [openDecision, setOpenDecision] = useState(0);
  const ws = WORKSPACES.find((w) => w.id === tab);

  return (
    <div className="animate-fade mx-auto max-w-6xl px-6 py-10">
      <span className="text-xs font-bold uppercase tracking-widest text-amber-dark">
        Under the hood
      </span>
      <h1 className="mt-2 font-display text-4xl font-bold text-navy">How Vellum is built</h1>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-gray-600">
        A technical walkthrough of the whole system — the architecture, each
        pipeline, the stack, the API surface, and the design calls behind it,
        including the ones with real tradeoffs. Everything below reflects what
        is actually running, not an aspirational diagram.
      </p>

      <Section
        eyebrow="Architecture"
        title="How the pieces fit together"
        lead="A React SPA talking to a thin Flask API, which delegates to one module per capability and to whichever inference backend is selected."
      >
        <ArchitectureDiagram />
      </Section>

      <Section
        eyebrow="The core idea"
        title="Why one model beats three stages"
        lead="The conventional pipeline loses information at every handoff. OCR flattens a page into characters, discarding layout, handwriting nuance, and any signal about scan quality — all before the language model has seen anything."
      >
        <StageComparisonDiagram />
      </Section>

      <Section
        eyebrow="Pipelines"
        title="What each workspace actually does"
        lead="Four capabilities, one shared spine: normalise the document, call a model with a pinned output schema, return something a person can check."
      >
        <div className="mb-5 flex flex-wrap gap-2">
          {WORKSPACES.map((w) => {
            const Icon = w.icon;
            const active = tab === w.id;
            return (
              <button
                key={w.id}
                onClick={() => setTab(w.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-navy text-white shadow-sm"
                    : "bg-white text-gray-600 ring-1 ring-black/5 hover:text-navy"
                }`}
              >
                <Icon size={15} />
                {w.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <code className="rounded-md bg-navy/5 px-2 py-1 font-mono text-xs text-navy">
            {ws.endpoint}
          </code>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-700">{ws.blurb}</p>
        </div>

        <div className="mt-4">
          <FlowDiagram steps={ws.steps} note={ws.note} />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {ws.detail.map(([h, b]) => (
            <div key={h} className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
              <h4 className="text-sm font-bold text-navy">{h}</h4>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{b}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Stack" title="What it's built with">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STACK.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.group} className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-white">
                    <Icon size={17} />
                  </span>
                  <h4 className="font-semibold text-navy">{s.group}</h4>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.items.map((it) => (
                    <span key={it} className="rounded-md bg-gray-50 px-2 py-1 font-mono text-xs text-gray-600">
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        eyebrow="API"
        title="Every endpoint"
        lead="All document endpoints accept either an uploaded file (PDF, image, or plain text) or pasted text. PDFs use their embedded text layer when present and fall back to OCR for scans."
      >
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
          <table className="w-full text-sm">
            <tbody>
              {ENDPOINTS.map(([method, path, desc], i) => (
                <tr key={path} className={i % 2 ? "bg-gray-50/60" : ""}>
                  <td className="w-16 py-2.5 pl-5 align-top">
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold text-white ${
                        method === "GET" ? "bg-good" : "bg-navy"
                      }`}
                    >
                      {method}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-navy">{path}</td>
                  <td className="py-2.5 pr-5 text-gray-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        eyebrow="Tradeoffs"
        title="Design decisions worth defending"
        lead="The interesting parts of a build are the choices that could have gone the other way. These are the ones that did."
      >
        <div className="space-y-3">
          {DECISIONS.map((d, i) => (
            <Accordion
              key={d.q}
              item={d}
              open={openDecision === i}
              onToggle={() => setOpenDecision(openDecision === i ? -1 : i)}
            />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Research"
        title="What the written report found"
        lead="The product exists to demonstrate an argument. This is that argument in plain English — the same content as the two-page written deliverable, minus the jargon and citations."
      >
        <ReportFindings />
      </Section>

      <Section
        eyebrow="Limits"
        title="What this does not do"
        lead="Stated plainly, because a demo that hides its edges is not evidence of anything."
      >
        <div className="rounded-2xl bg-navy p-7 text-white">
          <ul className="grid gap-3 sm:grid-cols-2">
            {LIMITS.map((l) => (
              <li key={l} className="flex gap-2.5 text-sm leading-relaxed text-ice">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                {l}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <footer className="mt-16 border-t border-gray-100 pt-8 text-xs text-gray-400">
        Built by Aditya Desai for the Cotiviti intern assessment. Source, written
        report, and slides are in the project repository.
      </footer>
    </div>
  );
}
