const COLORS = {
  high: "bg-good text-white",
  medium: "bg-amber-dark text-white",
  low: "bg-bad text-white",
};

export default function ConfidenceBadge({ level }) {
  const cls = COLORS[level] || "bg-gray-400 text-white";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {level || "unknown"}
    </span>
  );
}

export function ReviewFlag() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-bad">
      🚩 needs review
    </span>
  );
}
