import { useState } from "react";
import {
  ArrowRight,
  Braces,
  Check,
  Copy,
  FileDiff,
  FileText,
  Loader2,
  Minus,
  Pencil,
  Plus,
  ScrollText,
} from "lucide-react";
import DocInput from "./DocInput";
import Select from "./Select";
import { summarizeContent, compareContent, contentToRules } from "../api";

const MODES = [
  { id: "summarize", label: "Summarize", icon: ScrollText },
  { id: "compare", label: "Compare versions", icon: FileDiff },
  { id: "rules", label: "Convert to rules", icon: Braces },
];

const DOC_TYPES = [
  { value: "billing_policy", label: "Billing & coding policy", hint: "Payer coverage / payment rules" },
  { value: "clinical_guideline", label: "Clinical practice guideline", hint: "Care standards and pathways" },
  { value: "payer_contract", label: "Payer–provider contract", hint: "Negotiated terms and rates" },
  { value: "other", label: "Other policy document", hint: "Anything else" },
];

const TARGETS = [
  { value: "rules_json", label: "Declarative JSON rules", hint: "Portable, engine-agnostic" },
  { value: "python", label: "Python", hint: "Executable functions" },
  { value: "sql", label: "SQL", hint: "Query against a claims table" },
  { value: "features", label: "Model features", hint: "Decision inputs for an ML model" },
];

const MATERIALITY = { high: "bg-bad", medium: "bg-amber-dark", low: "bg-gray-400" };
const CHANGE_ICON = { added: Plus, removed: Minus, modified: Pencil, clarified: FileText };

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-navy">{children}</h4>
  );
}

function CopyButton({ value }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 transition hover:border-navy hover:text-navy"
    >
      {done ? <Check size={12} /> : <Copy size={12} />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

/* ------------------------------ Results ------------------------------ */

function SummaryResult({ data }) {
  return (
    <Card>
      <h3 className="font-display text-xl font-bold text-navy">{data.title}</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-gray-700">{data.plain_summary}</p>

      {data.codes_referenced?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {data.codes_referenced.map((c) => (
            <span key={c} className="rounded-full bg-navy/5 px-2.5 py-1 font-mono text-xs text-navy">
              {c}
            </span>
          ))}
        </div>
      )}

      {data.key_points?.length > 0 && (
        <div className="mt-6">
          <SectionTitle>Key points</SectionTitle>
          <div className="space-y-2.5">
            {data.key_points.map((k, i) => (
              <div key={i} className="border-l-2 border-amber pl-3">
                <p className="text-sm font-semibold text-navy">{k.point}</p>
                <p className="text-sm text-gray-600">{k.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.obligations?.length > 0 && (
        <div className="mt-6">
          <SectionTitle>Obligations & requirements</SectionTitle>
          <div className="space-y-3">
            {data.obligations.map((o, i) => (
              <div key={i} className="rounded-xl bg-gray-50 p-3.5">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {o.who}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-gray-800">{o.requirement}</p>
                <p className="mt-1 text-xs italic text-gray-400">"{o.evidence_quote}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.open_questions?.length > 0 && (
        <div className="mt-6 rounded-xl bg-amber/10 p-4">
          <SectionTitle>Needs clarification</SectionTitle>
          <ul className="space-y-1.5">
            {data.open_questions.map((q, i) => (
              <li key={i} className="text-sm text-amber-dark">
                • {q}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function CompareResult({ data }) {
  return (
    <Card>
      <h3 className="font-display text-xl font-bold text-navy">What changed</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-gray-700">{data.overview}</p>

      <div className="mt-6 space-y-3">
        {data.changes?.map((c, i) => {
          const Icon = CHANGE_ICON[c.change_type] || Pencil;
          return (
            <div key={i} className="rounded-xl border border-gray-100 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-navy/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy">
                  <Icon size={11} />
                  {c.change_type}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${
                    MATERIALITY[c.materiality] || "bg-gray-400"
                  }`}
                >
                  {c.materiality}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-navy">{c.summary}</p>

              {(c.before !== "N/A" || c.after !== "N/A") && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg bg-bad/5 p-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-bad">Before</div>
                    <p className="mt-0.5 text-xs text-gray-700">{c.before}</p>
                  </div>
                  <div className="rounded-lg bg-good/5 p-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-good">After</div>
                    <p className="mt-0.5 text-xs text-gray-700">{c.after}</p>
                  </div>
                </div>
              )}

              <p className="mt-2.5 text-sm text-gray-600">
                <span className="font-semibold text-navy">Impact: </span>
                {c.impact}
              </p>
            </div>
          );
        })}
      </div>

      {data.unchanged_but_notable?.length > 0 && (
        <div className="mt-6 rounded-xl bg-gray-50 p-4">
          <SectionTitle>Did not change</SectionTitle>
          <ul className="space-y-1.5">
            {data.unchanged_but_notable.map((u, i) => (
              <li key={i} className="text-sm text-gray-600">
                • {u}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function RulesResult({ data }) {
  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>How this was read</SectionTitle>
        <p className="text-sm leading-relaxed text-gray-700">{data.interpretation}</p>

        {data.inputs_required?.length > 0 && (
          <div className="mt-4">
            <SectionTitle>Data the rules need</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {data.inputs_required.map((f) => (
                <span key={f} className="rounded-md bg-navy/5 px-2 py-1 font-mono text-xs text-navy">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Extracted rules</SectionTitle>
        <div className="space-y-3">
          {data.rules?.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-100 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-navy px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                  {r.id}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${
                    r.confidence === "high"
                      ? "bg-good"
                      : r.confidence === "medium"
                        ? "bg-amber-dark"
                        : "bg-bad"
                  }`}
                >
                  {r.confidence}
                </span>
                <span className="text-sm font-semibold text-navy">{r.description}</span>
              </div>
              <div className="mt-2.5 space-y-1 font-mono text-xs">
                <div className="rounded-lg bg-gray-50 p-2">
                  <span className="font-bold text-gray-400">IF </span>
                  <span className="text-gray-800">{r.condition}</span>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <span className="font-bold text-gray-400">THEN </span>
                  <span className="text-gray-800">{r.action}</span>
                </div>
              </div>
              <p className="mt-2 text-xs italic text-gray-400">"{r.source_quote}"</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!bg-navy-deep !ring-0">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wide text-ice">Generated artifact</h4>
          <CopyButton value={data.code} />
        </div>
        <pre className="max-h-[28rem] overflow-auto rounded-xl bg-black/30 p-4 font-mono text-xs leading-relaxed text-ice">
          {data.code}
        </pre>
      </Card>

      {data.caveats?.length > 0 && (
        <Card className="!bg-amber/10 !ring-amber/20">
          <SectionTitle>Where the policy is too vague to encode</SectionTitle>
          <ul className="space-y-1.5">
            {data.caveats.map((c, i) => (
              <li key={i} className="text-sm text-amber-dark">
                • {c}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------ Workspace ------------------------------ */

export default function PolicyWorkspace() {
  const [mode, setMode] = useState("summarize");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [docType, setDocType] = useState("billing_policy");
  const [target, setTarget] = useState("rules_json");

  const [fileA, setFileA] = useState(null);
  const [textA, setTextA] = useState("");
  const [fileB, setFileB] = useState(null);
  const [textB, setTextB] = useState("");

  function switchMode(m) {
    setMode(m);
    setResult(null);
    setError(null);
  }

  const canRun =
    mode === "compare" ? (fileA || textA.trim()) && (fileB || textB.trim()) : file || text.trim();

  async function run() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      if (mode === "summarize") setResult(await summarizeContent({ file, text, docType }));
      else if (mode === "compare") setResult(await compareContent({ fileA, textA, fileB, textB }));
      else setResult(await contentToRules({ file, text, target }));
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full shrink-0 self-start space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:sticky lg:top-24 lg:w-72">
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-navy">Task</h2>
          <div className="space-y-1.5">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => switchMode(m.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                    active
                      ? "border-navy bg-navy/5 text-navy"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      active ? "bg-navy text-white" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Icon size={15} />
                  </span>
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {mode === "summarize" && (
          <div className="border-t border-gray-100 pt-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
              Document type
            </label>
            <Select value={docType} onChange={setDocType} options={DOC_TYPES} icon={FileText} />
          </div>
        )}

        {mode === "rules" && (
          <div className="border-t border-gray-100 pt-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
              Output format
            </label>
            <Select value={target} onChange={setTarget} options={TARGETS} icon={Braces} />
          </div>
        )}
      </aside>

      <div className="min-w-0 flex-1 space-y-5">
        <Card>
          {mode === "compare" ? (
            <div className="grid gap-5 md:grid-cols-2">
              <DocInput
                label="Version A — earlier"
                file={fileA}
                setFile={setFileA}
                text={textA}
                setText={setTextA}
              />
              <DocInput
                label="Version B — later"
                file={fileB}
                setFile={setFileB}
                text={textB}
                setText={setTextB}
              />
            </div>
          ) : (
            <DocInput
              label="Policy document"
              hint={
                mode === "rules"
                  ? "Works best on a single policy section rather than a whole manual."
                  : undefined
              }
              file={file}
              setFile={setFile}
              text={text}
              setText={setText}
              rows={9}
            />
          )}
        </Card>

        <button
          onClick={run}
          disabled={!canRun || running}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber py-3.5 text-sm font-bold text-navy shadow-lg shadow-amber/20 transition hover:brightness-105 disabled:opacity-40 disabled:shadow-none"
        >
          {running ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          {running
            ? "Analyzing…"
            : mode === "summarize"
              ? "Summarize document"
              : mode === "compare"
                ? "Compare versions"
                : "Convert to rules"}
        </button>

        {error && (
          <p className="rounded-xl bg-bad/5 px-4 py-3 text-sm font-medium text-bad ring-1 ring-bad/20">
            {error}
          </p>
        )}

        {result && mode === "summarize" && <SummaryResult data={result} />}
        {result && mode === "compare" && <CompareResult data={result} />}
        {result && mode === "rules" && <RulesResult data={result} />}
      </div>
    </div>
  );
}
