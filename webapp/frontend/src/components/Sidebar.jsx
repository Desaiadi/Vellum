import { Cloud, HardDrive, SlidersHorizontal } from "lucide-react";
import Toggle from "./Toggle";

const BACKENDS = [
  { value: "claude", label: "Claude API (cloud)", sub: "claude-sonnet-5", icon: Cloud },
  { value: "ollama", label: "Local Ollama (offline, free)", sub: "llava / llama3.2:1b", icon: HardDrive },
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
    <aside className="w-full shrink-0 self-start space-y-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:sticky lg:top-24 lg:w-72">
      <div>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-navy">
          <SlidersHorizontal size={14} />
          Inference backend
        </h2>
        <div className="space-y-2">
          {BACKENDS.map((b) => {
            const Icon = b.icon;
            const active = backend === b.value;
            return (
              <button
                key={b.value}
                type="button"
                onClick={() => setBackend(b.value)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                  active ? "border-navy bg-navy/5" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    active ? "bg-navy text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <Icon size={17} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-navy">{b.label}</div>
                  <div className="truncate font-mono text-xs text-gray-500">{b.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
        {backend === "ollama" && (
          <p className="mt-2 text-xs text-gray-500">
            Requires <code className="rounded bg-gray-100 px-1">ollama serve</code> running
            locally with the models pulled.
          </p>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-navy">Options</h2>
        <Toggle
          checked={showComparison}
          onChange={setShowComparison}
          label="Classic OCR pipeline"
          hint="Side-by-side comparison against the multi-stage approach."
        />
        <Toggle
          checked={deid}
          onChange={setDeid}
          label="De-identified view"
          hint="Tokenizes patient name/DOB/MRN in the output record."
        />
      </div>
    </aside>
  );
}
