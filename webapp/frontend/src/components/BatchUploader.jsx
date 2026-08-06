import { useRef, useState } from "react";
import { FileText, Image as ImageIcon, Loader2, UploadCloud } from "lucide-react";

const ACCEPTED_TYPES = "image/png,image/jpeg,application/pdf";

function isPdf(file) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export default function BatchUploader({ files, setFiles, onRun, running }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    setFiles(Array.from(e.dataTransfer.files || []));
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-navy">Batch upload</h2>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragOver ? "border-navy bg-navy/5" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <UploadCloud size={22} className={dragOver ? "text-navy" : "text-gray-400"} />
        <span className="mt-1.5 text-sm font-medium text-gray-600">
          Drag & drop, or <span className="text-navy underline">browse</span>
        </span>
        <span className="mt-0.5 text-xs text-gray-400">PNG, JPG, or PDF — any number of files</span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          className="hidden"
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm text-gray-600">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 truncate">
              {isPdf(f) ? (
                <FileText size={14} className="shrink-0 text-gray-400" />
              ) : (
                <ImageIcon size={14} className="shrink-0 text-gray-400" />
              )}
              <span className="truncate">{f.name}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onRun}
        disabled={files.length === 0 || running}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-2.5 text-sm font-semibold text-white transition hover:bg-navy-dark disabled:opacity-40"
      >
        {running && <Loader2 size={16} className="animate-spin" />}
        {running ? "Processing…" : `Process ${files.length || ""} document${files.length === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}
