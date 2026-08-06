const BACKENDS = [
  { value: "claude", label: "Claude API (cloud)", sub: "claude-sonnet-5" },
  { value: "ollama", label: "Local Ollama (offline, free)", sub: "llava / llama3.2:1b" },
];

export default function Sidebar({
  backend,
  setBackend,
  showComparison,
  setShowComparison,
  deid,
  setDeid,
}) {
  return (
    <aside className="w-full shrink-0 space-y-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:w-72">
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-navy">
          Inference backend
        </h2>
        <div className="space-y-2">
          {BACKENDS.map((b) => (
            <label
              key={b.value}
              className={`flex cursor-pointer flex-col rounded-xl border px-3 py-2 transition ${
                backend === b.value
                  ? "border-navy bg-navy/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="backend"
                  value={b.value}
                  checked={backend === b.value}
                  onChange={() => setBackend(b.value)}
                  className="accent-[#1e2761]"
                />
                <span className="text-sm font-semibold text-navy">{b.label}</span>
              </div>
              <span className="ml-6 font-mono text-xs text-gray-500">{b.sub}</span>
            </label>
          ))}
        </div>
        {backend === "ollama" && (
          <p className="mt-2 text-xs text-gray-500">
            Requires <code className="rounded bg-gray-100 px-1">ollama serve</code> running
            locally with the models pulled.
          </p>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-navy">Options</h2>
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={showComparison}
            onChange={(e) => setShowComparison(e.target.checked)}
            className="mt-0.5 accent-[#1e2761]"
          />
          <span>
            Also run classic OCR pipeline
            <span className="block text-xs text-gray-400">
              Side-by-side comparison against the multi-stage approach.
            </span>
          </span>
        </label>
        <label className="mt-3 flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={deid}
            onChange={(e) => setDeid(e.target.checked)}
            className="mt-0.5 accent-[#1e2761]"
          />
          <span>
            De-identified view
            <span className="block text-xs text-gray-400">
              Tokenizes patient name/DOB/MRN in the output record.
            </span>
          </span>
        </label>
      </div>
    </aside>
  );
}
