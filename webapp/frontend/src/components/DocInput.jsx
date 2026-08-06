import { useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";

const ACCEPTED = "application/pdf,image/png,image/jpeg,text/plain,.txt,.md";

/** Upload-a-file OR paste-text input, used by the policy and record tools. */
export default function DocInput({ label, hint, file, setFile, text, setText, rows = 7 }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  function clear() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </label>
      )}

      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-navy/20 bg-navy/5 p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
            <FileText size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy">{file.name}</p>
            <p className="text-xs text-gray-400">Text will be read from this file</p>
          </div>
          <button
            onClick={clear}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-white hover:text-navy"
            aria-label="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${
              dragOver ? "border-navy bg-navy/5" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/60"
            }`}
          >
            <UploadCloud size={20} className={dragOver ? "text-navy" : "text-gray-400"} />
            <span className="mt-1.5 text-sm font-medium text-gray-600">
              Drop a file, or <span className="text-navy underline">browse</span>
            </span>
            <span className="mt-0.5 text-xs text-gray-400">PDF, image, or plain text</span>
          </div>

          <div className="my-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-gray-100" />
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-300">
              or paste it
            </span>
            <span className="h-px flex-1 bg-gray-100" />
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={rows}
            placeholder="Paste the text here…"
            className="w-full resize-y rounded-xl border border-gray-200 p-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
          />
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setFile(f);
        }}
      />

      {hint && <p className="mt-2 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
