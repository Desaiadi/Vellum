import { useRef, useState } from "react";
import { FileText, Image as ImageIcon, UploadCloud } from "lucide-react";
import { sampleUrl } from "../api";

const ACCEPTED_TYPES = "image/png,image/jpeg,application/pdf";

function isPdf(file) {
  return file && (file.type === "application/pdf" || /\.pdf$/i.test(file.name));
}

export default function DocumentPicker({ samples, sample, setSample, file, setFile }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const previewUrl = file && !isPdf(file) ? URL.createObjectURL(file) : sample ? sampleUrl(sample) : null;

  function pickFile(f) {
    if (!f) return;
    setFile(f);
    setSample(null);
  }

  function onPickSample(name) {
    setSample(name);
    setFile(null);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-navy">Document</h2>

      <div className="mb-3 flex flex-wrap gap-2">
        {samples.map((name) => (
          <button
            key={name}
            onClick={() => onPickSample(name)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              sample === name
                ? "border-navy bg-navy text-white"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <ImageIcon size={13} />
            {name.replace(/\.png$/, "").replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
          dragOver ? "border-navy bg-navy/5" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <UploadCloud size={22} className={dragOver ? "text-navy" : "text-gray-400"} />
        <span className="mt-1.5 text-sm font-medium text-gray-600">
          Drag & drop, or <span className="text-navy underline">browse</span>
        </span>
        <span className="mt-0.5 text-xs text-gray-400">PNG, JPG, or PDF</span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>

      {file && isPdf(file) && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-navy/10 text-navy">
            <FileText size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-navy">{file.name}</p>
            <p className="text-xs text-gray-400">PDF · first page will be read</p>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
          <img src={previewUrl} alt="Selected document" className="max-h-96 w-full object-contain bg-gray-50" />
        </div>
      )}
    </div>
  );
}
