import { useState } from "react";

const NAVY = "#1e2761";
const NAVY_DEEP = "#0d1232";
const AMBER = "#f2b134";
const ICE = "#cadcfc";
const LINE = "#c7cde6";

function Arrow({ id }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" fill={LINE} />
    </marker>
  );
}

/* ------------------------------------------------------------------ */
/* System architecture — click a layer to read what it does            */
/* ------------------------------------------------------------------ */

const LAYERS = {
  ui: {
    title: "React single-page app",
    stack: "React 19 · Vite · Tailwind CSS 4 · lucide-react",
    detail:
      "One SPA with no router — the active workspace is component state, so switching tools never round-trips to the server. All API access goes through a single fetch wrapper (src/api.js) that normalises errors, and Vite proxies /api to the Flask process in development so there is no CORS dance locally.",
    responsibilities: [
      "Document upload (drag-drop, file picker, or paste)",
      "Renders confidence badges and needs-review flags",
      "Holds batch results in session state — no database",
    ],
  },
  api: {
    title: "Flask API",
    stack: "Flask 3 · flask-cors · Python 3.14",
    detail:
      "A deliberately thin route layer. Every route parses the request, delegates to one domain module, and serialises the result — there is no business logic in app.py. That is what let the same extraction code power both the Streamlit POC and this web app without a rewrite.",
    responsibilities: [
      "app.py — routes only",
      "pipelines.py — extraction (ported unchanged from the POC)",
      "content_tools.py · record_explainer.py · deid.py · chatbot.py",
    ],
  },
  docio: {
    title: "Document I/O",
    stack: "PyMuPDF · Tesseract · Pillow",
    detail:
      "Normalises anything a user drops in into something a model can read. PDFs use their embedded text layer when they have one — exact and fast — and fall back to OCR of rendered pages when they are scans. Images always go through OCR for the text path, or straight to the model as pixels for the multimodal path.",
    responsibilities: [
      "PDF → first page image, at 200 DPI",
      "PDF → text layer, with OCR fallback for scans",
      "Image → OCR text (the comparison pipeline only)",
    ],
  },
  inference: {
    title: "Inference backends",
    stack: "Anthropic SDK (claude-sonnet-5) · Ollama (llava, llama3.2:1b)",
    detail:
      "Two interchangeable backends behind one interface. Cloud runs Claude with structured outputs, so the JSON shape is guaranteed by the API rather than parsed hopefully. Local runs an open-weights model through Ollama with a best-effort JSON parse, because small local models do not reliably honour a schema — a limitation the project measures rather than hides.",
    responsibilities: [
      "Structured outputs pin the extraction schema (cloud)",
      "Same prompts, both backends — the comparison is fair",
      "Local path needs no API key and costs nothing per call",
    ],
  },
  knowledge: {
    title: "Grounding corpus",
    stack: "Three markdown files, loaded per request",
    detail:
      "The assistant's knowledge is the written report, a project description, and the builder's profile — about 4K tokens in total. That is small enough to put in the system prompt in full, which is strictly more reliable than chunk-and-retrieve at this size: there is no retrieval step that can miss the relevant passage.",
    responsibilities: [
      "knowledge/report.md — the written research report",
      "knowledge/project_info.md — what Vellum does and does not do",
      "knowledge/profile.md — builder background",
    ],
  },
};

function Box({ id, x, y, w, h, label, sub, active, onClick, dark }) {
  return (
    <g onClick={() => onClick(id)} style={{ cursor: "pointer" }}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="10"
        fill={dark ? NAVY : "#fff"}
        stroke={active ? AMBER : dark ? NAVY : LINE}
        strokeWidth={active ? 2.5 : 1.5}
      />
      <text
        x={x + w / 2}
        y={y + (sub ? h / 2 - 6 : h / 2 + 4)}
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill={dark ? "#fff" : NAVY}
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 12}
          textAnchor="middle"
          fontSize="10.5"
          fill={dark ? ICE : "#7b83a6"}
        >
          {sub}
        </text>
      )}
    </g>
  );
}

export function ArchitectureDiagram() {
  const [sel, setSel] = useState("api");
  const info = LAYERS[sel];

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl bg-white p-4 ring-1 ring-black/5">
        <svg viewBox="0 0 900 400" className="w-full min-w-[640px]" role="img">
          <defs>
            <Arrow id="ar" />
          </defs>

          <text x="20" y="28" fontSize="10.5" fontWeight="700" fill="#a3aac9" letterSpacing="1.2">
            CLIENT
          </text>
          <Box
            id="ui"
            x={300}
            y={40}
            w={300}
            h={62}
            label="React SPA"
            sub="Vite · Tailwind · one page, no router"
            active={sel === "ui"}
            onClick={setSel}
          />

          <line x1="450" y1="102" x2="450" y2="148" stroke={LINE} strokeWidth="1.5" markerEnd="url(#ar)" />
          <text x="462" y="130" fontSize="10" fill="#a3aac9">
            fetch /api/*
          </text>

          <text x="20" y="175" fontSize="10.5" fontWeight="700" fill="#a3aac9" letterSpacing="1.2">
            SERVER
          </text>
          <Box
            id="api"
            x={300}
            y={150}
            w={300}
            h={62}
            label="Flask API"
            sub="routes only — logic lives in modules"
            active={sel === "api"}
            onClick={setSel}
            dark
          />

          {/* fan-out */}
          <path d="M 380 212 L 380 250 L 155 250 L 155 288" stroke={LINE} strokeWidth="1.5" fill="none" markerEnd="url(#ar)" />
          <path d="M 450 212 L 450 288" stroke={LINE} strokeWidth="1.5" fill="none" markerEnd="url(#ar)" />
          <path d="M 520 212 L 520 250 L 745 250 L 745 288" stroke={LINE} strokeWidth="1.5" fill="none" markerEnd="url(#ar)" />

          <Box
            id="docio"
            x={40}
            y={290}
            w={230}
            h={72}
            label="Document I/O"
            sub="PyMuPDF · Tesseract · Pillow"
            active={sel === "docio"}
            onClick={setSel}
          />
          <Box
            id="inference"
            x={335}
            y={290}
            w={230}
            h={72}
            label="Inference"
            sub="Claude API  |  local Ollama"
            active={sel === "inference"}
            onClick={setSel}
          />
          <Box
            id="knowledge"
            x={630}
            y={290}
            w={230}
            h={72}
            label="Grounding corpus"
            sub="3 markdown files"
            active={sel === "knowledge"}
            onClick={setSel}
          />
        </svg>
      </div>

      <div className="mt-4 rounded-2xl bg-navy p-6 text-white">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="font-display text-lg font-bold">{info.title}</h4>
          <span className="font-mono text-xs text-ice/70">{info.stack}</span>
        </div>
        <p className="mt-2.5 text-sm leading-relaxed text-ice">{info.detail}</p>
        <ul className="mt-4 grid gap-1.5 sm:grid-cols-3">
          {info.responsibilities.map((r) => (
            <li key={r} className="flex gap-2 text-xs leading-relaxed text-ice/85">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber" />
              {r}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[11px] text-ice/50">Click any block in the diagram to inspect it.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Generic left-to-right pipeline flow                                  */
/* ------------------------------------------------------------------ */

export function FlowDiagram({ steps, note }) {
  const boxW = 150;
  const gap = 42;
  const total = steps.length * boxW + (steps.length - 1) * gap;
  const startX = Math.max(20, (900 - total) / 2);

  return (
    <div className="overflow-x-auto rounded-2xl bg-white p-4 ring-1 ring-black/5">
      <svg viewBox="0 0 900 150" className="w-full min-w-[620px]" role="img">
        <defs>
          <Arrow id="fa" />
        </defs>
        {steps.map((s, i) => {
          const x = startX + i * (boxW + gap);
          const isLast = i === steps.length - 1;
          const isFirst = i === 0;
          return (
            <g key={s.label}>
              <rect
                x={x}
                y={34}
                width={boxW}
                height={62}
                rx="10"
                fill={isLast ? NAVY : isFirst ? "#f4f6fc" : "#fff"}
                stroke={isLast ? NAVY : LINE}
                strokeWidth="1.5"
              />
              <text
                x={x + boxW / 2}
                y={58}
                textAnchor="middle"
                fontSize="12.5"
                fontWeight="700"
                fill={isLast ? "#fff" : NAVY}
              >
                {s.label}
              </text>
              <text
                x={x + boxW / 2}
                y={76}
                textAnchor="middle"
                fontSize="10"
                fill={isLast ? ICE : "#7b83a6"}
              >
                {s.sub}
              </text>
              {!isLast && (
                <line
                  x1={x + boxW + 6}
                  y1="65"
                  x2={x + boxW + gap - 6}
                  y2="65"
                  stroke={LINE}
                  strokeWidth="1.5"
                  markerEnd="url(#fa)"
                />
              )}
            </g>
          );
        })}
        {note && (
          <text x="450" y="126" textAnchor="middle" fontSize="11" fill="#a3aac9" fontStyle="italic">
            {note}
          </text>
        )}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Old pipeline vs Vellum — the core technical argument                 */
/* ------------------------------------------------------------------ */

export function StageComparisonDiagram() {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white p-4 ring-1 ring-black/5">
      <svg viewBox="0 0 900 260" className="w-full min-w-[640px]" role="img">
        <defs>
          <Arrow id="ca" />
        </defs>

        <text x="20" y="30" fontSize="11" fontWeight="700" fill="#a3aac9" letterSpacing="1">
          CONVENTIONAL — 3 STAGES, 2 LOSSY HANDOFFS
        </text>
        {["Scan", "OCR", "NER", "Code lookup", "Record"].map((label, i) => {
          const x = 20 + i * 176;
          const isEnd = i === 4;
          return (
            <g key={label}>
              <rect
                x={x}
                y={46}
                width={140}
                height={44}
                rx="8"
                fill={isEnd ? "#eef0f8" : "#fff"}
                stroke={LINE}
                strokeWidth="1.5"
              />
              <text x={x + 70} y={73} textAnchor="middle" fontSize="12" fontWeight="600" fill={NAVY}>
                {label}
              </text>
              {i < 4 && (
                <line x1={x + 146} y1="68" x2={x + 170} y2="68" stroke={LINE} strokeWidth="1.5" markerEnd="url(#ca)" />
              )}
              {(i === 1 || i === 2) && (
                <text x={x + 158} y="110" textAnchor="middle" fontSize="16" fill="#c0392b">
                  ✕
                </text>
              )}
            </g>
          );
        })}
        <text x="20" y="132" fontSize="10.5" fill="#c0392b">
          ✕ layout, handwriting nuance, and image quality are gone before the language model ever sees the page
        </text>

        <line x1="20" y1="152" x2="880" y2="152" stroke="#eef0f8" strokeWidth="1.5" />

        <text x="20" y="180" fontSize="11" fontWeight="700" fill="#b8790a" letterSpacing="1">
          VELLUM — 1 STAGE, NO HANDOFF
        </text>
        <rect x="20" y="196" width="140" height="44" rx="8" fill="#fff" stroke={LINE} strokeWidth="1.5" />
        <text x="90" y="223" textAnchor="middle" fontSize="12" fontWeight="600" fill={NAVY}>
          Scan
        </text>
        <line x1="166" y1="218" x2="190" y2="218" stroke={LINE} strokeWidth="1.5" markerEnd="url(#ca)" />

        <rect x="196" y="196" width="492" height="44" rx="8" fill={NAVY_DEEP} stroke={NAVY_DEEP} strokeWidth="1.5" />
        <text x="442" y="217" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#fff">
          One multimodal call
        </text>
        <text x="442" y="232" textAnchor="middle" fontSize="10" fill={ICE}>
          reads layout + text + scan quality together, and scores its own confidence
        </text>
        <line x1="694" y1="218" x2="718" y2="218" stroke={LINE} strokeWidth="1.5" markerEnd="url(#ca)" />

        <rect x="724" y="196" width="156" height="44" rx="8" fill="#fff" stroke={AMBER} strokeWidth="2" />
        <text x="802" y="217" textAnchor="middle" fontSize="12" fontWeight="700" fill={NAVY}>
          Record
        </text>
        <text x="802" y="232" textAnchor="middle" fontSize="10" fill="#b8790a">
          + confidence + flags
        </text>
      </svg>
    </div>
  );
}
