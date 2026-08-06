import { useState } from "react";
import ConfidenceBadge, { ReviewFlag } from "./ConfidenceBadge";
import ExtractionResult from "./ExtractionResult";

function overallConfidence(record) {
  const all = [
    record.patient.confidence,
    record.provider.confidence,
    record.dates.confidence,
    ...record.diagnoses.map((d) => d.confidence),
    ...record.procedures.map((p) => p.confidence),
  ];
  if (all.includes("low")) return "low";
  if (all.includes("medium")) return "medium";
  return "high";
}

export default function ReviewQueue({ results, showDeid }) {
  const [expanded, setExpanded] = useState(null);

  if (results.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-400 shadow-sm ring-1 ring-black/5">
        Upload a batch of documents to build a review queue.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((r, i) => {
        const isOpen = expanded === i;
        const record = r.error ? null : showDeid && r.deidentified_record ? r.deidentified_record : r.record;
        return (
          <div key={i} className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <button
              onClick={() => setExpanded(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-lg">{isOpen ? "▾" : "▸"}</span>
                <span className="truncate text-sm font-semibold text-navy">{r.filename}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {r.error ? (
                  <span className="text-xs font-semibold text-bad">error</span>
                ) : (
                  <>
                    <ConfidenceBadge level={overallConfidence(record)} />
                    {record.needs_review && <ReviewFlag />}
                  </>
                )}
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-gray-100 p-4">
                {r.error ? (
                  <p className="text-sm text-bad">{r.error}</p>
                ) : (
                  <ExtractionResult result={r} showDeid={showDeid} />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { overallConfidence };
