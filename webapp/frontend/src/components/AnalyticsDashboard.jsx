import { BarChart3 } from "lucide-react";
import { overallConfidence } from "./ReviewQueue";

function StatCard({ value, label, accent }) {
  return (
    <div className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
      <div className={`font-serif-head text-4xl font-bold ${accent || "text-navy"}`}>{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</div>
    </div>
  );
}

function Bar({ label, count, total, color }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-2 flex items-center gap-3 text-sm">
      <span className="w-16 shrink-0 text-gray-500">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-10 shrink-0 text-right font-semibold text-navy">{count}</span>
    </div>
  );
}

export default function AnalyticsDashboard({ results }) {
  const ok = results.filter((r) => !r.error);
  const total = ok.length;
  const needsReview = ok.filter((r) => (r.deidentified_record || r.record).needs_review).length;
  const confCounts = { high: 0, medium: 0, low: 0 };
  ok.forEach((r) => {
    confCounts[overallConfidence(r.record)] += 1;
  });

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-navy p-5 text-white shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 font-serif-head text-lg font-bold">
        <BarChart3 size={18} className="text-amber" />
        Batch analytics
      </h3>
      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatCard value={total} label="Processed" />
        <StatCard value={results.length - total} label="Errors" accent="text-bad" />
        <StatCard
          value={total ? `${Math.round((needsReview / total) * 100)}%` : "—"}
          label="Needs review"
          accent="text-amber"
        />
      </div>
      <div className="rounded-xl bg-white p-4 text-navy">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
          Overall confidence distribution
        </h4>
        <Bar label="High" count={confCounts.high} total={total} color="#2e9e5b" />
        <Bar label="Medium" count={confCounts.medium} total={total} color="#b8790a" />
        <Bar label="Low" count={confCounts.low} total={total} color="#c0392b" />
      </div>
    </div>
  );
}
