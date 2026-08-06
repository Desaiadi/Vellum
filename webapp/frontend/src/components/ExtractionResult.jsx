import { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  ClipboardList,
  Loader2,
  Sparkles,
  Stethoscope,
  User,
} from "lucide-react";
import ConfidenceBadge, { ReviewFlag } from "./ConfidenceBadge";
import { explainSnippet } from "../api";

function Field({ icon: Icon, label, value, confidence }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">
        {Icon && <Icon size={11} />}
        {label}
      </div>
      <div className="mt-0.5 flex items-center gap-2">
        <span className="font-semibold text-navy">{value}</span>
        <ConfidenceBadge level={confidence} />
      </div>
    </div>
  );
}

function CodeRow({ item, codeLabel }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);

  async function explain() {
    setLoading(true);
    try {
      setExplanation(await explainSnippet(`${item.description} (${codeLabel} ${item.code})`));
    } catch (e) {
      setExplanation(`Couldn't get an explanation: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-b border-gray-100 py-2.5 last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800">{item.description}</span>
          <span className="font-mono text-xs text-gray-400">
            {codeLabel}: {item.code}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ConfidenceBadge level={item.confidence} />
          {item.needs_review && <ReviewFlag />}
          <button
            onClick={explain}
            disabled={loading}
            className="flex items-center gap-1 rounded-full border border-navy/20 px-2 py-0.5 text-xs font-medium text-navy transition hover:border-navy hover:bg-navy/5 disabled:opacity-50"
          >
            {loading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            explain
          </button>
        </div>
      </div>
      <div className="mt-0.5 text-xs italic text-gray-400">
        Evidence: "{item.evidence_quote}"
      </div>
      {explanation && (
        <div className="mt-2 rounded-lg bg-navy/5 p-2.5 text-sm text-navy">{explanation}</div>
      )}
    </div>
  );
}

export default function ExtractionResult({ result, showDeid }) {
  if (!result) return null;
  if (result.error) {
    return (
      <div className="rounded-2xl bg-bad/5 p-5 text-sm font-medium text-bad ring-1 ring-bad/20">
        {result.error}
      </div>
    );
  }

  const record = showDeid && result.deidentified_record ? result.deidentified_record : result.record;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-serif-head text-lg font-bold text-navy">{result.pipeline_name}</h3>
        <span className="text-xs text-gray-400">
          {result.backend === "claude" ? "Claude API" : "Local Ollama"} · {result.elapsed_seconds.toFixed(1)}s
        </span>
      </div>

      {record.needs_review && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber/15 px-3 py-2 text-sm font-semibold text-amber-dark">
          <AlertTriangle size={15} />
          One or more fields flagged for human review.
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-3">
        <Field icon={User} label="Patient" value={`${record.patient.name} · DOB ${record.patient.dob}`} confidence={record.patient.confidence} />
        <Field icon={Stethoscope} label="Provider" value={`${record.provider.name} (${record.provider.identifier})`} confidence={record.provider.confidence} />
        <Field icon={Calendar} label="Date of Service" value={record.dates.date_of_service} confidence={record.dates.confidence} />
      </div>

      <div className="mb-4">
        <h4 className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-navy">
          <Stethoscope size={13} />
          Diagnoses (ICD-10)
        </h4>
        {record.diagnoses.length === 0 ? (
          <p className="text-sm text-gray-400">None found.</p>
        ) : (
          record.diagnoses.map((d, i) => <CodeRow key={i} item={d} codeLabel="ICD-10" />)
        )}
      </div>

      <div>
        <h4 className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-navy">
          <ClipboardList size={13} />
          Procedures (CPT)
        </h4>
        {record.procedures.length === 0 ? (
          <p className="text-sm text-gray-400">None found.</p>
        ) : (
          record.procedures.map((p, i) => <CodeRow key={i} item={p} codeLabel="CPT" />)
        )}
      </div>

      {result.ocr_text != null && (
        <details className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
          <summary className="cursor-pointer font-semibold text-navy">OCR'd text (input to the LLM)</summary>
          <pre className="mt-2 whitespace-pre-wrap font-mono">{result.ocr_text}</pre>
        </details>
      )}
    </div>
  );
}
