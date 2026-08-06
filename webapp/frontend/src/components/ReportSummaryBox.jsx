import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { getReportSummary } from "../api";

export default function ReportSummaryBox() {
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
    <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy/10 text-navy">
          <FileText size={19} />
        </div>
        <h2 className="font-serif-head text-2xl font-bold text-navy">
          What does the report actually say?
        </h2>
      </div>
      <p className="mt-2 text-sm text-gray-400">
        A plain-English summary of <code className="rounded bg-gray-100 px-1">report/Vellum_Report.docx</code> —
        no jargon, no citations. Ask the chat assistant (bottom-right) if you want any part explained further.
      </p>

      {loading && (
        <p className="mt-6 flex items-center gap-2 text-sm text-gray-400">
          <Loader2 size={14} className="animate-spin" /> Summarizing…
        </p>
      )}
      {error && <p className="mt-6 text-sm text-bad">{error}</p>}
      {summary && (
        <div className="mt-6 space-y-4 whitespace-pre-line text-[15px] leading-relaxed text-gray-700">
          {summary}
        </div>
      )}
    </div>
  );
}
