import { useRef, useState } from "react";
import { FileText, FolderOpen, UploadCloud, X } from "lucide-react";
import Select from "./Select";
import { sampleUrl } from "../api";

const ACCEPTED_TYPES = "image/png,image/jpeg,application/pdf";

const QUALITY_HINT = {
  clean: "Clean scan",
  medium: "Light scan noise",
  degraded: "Degraded · blurred scan",
};

/** "discharge_summary_1_medium.png" -> "Discharge summary" */
function prettify(name) {
  const base = name
    .replace(/\.(png|jpe?g|pdf)$/i, "")
    .replace(/_/g, " ")
    .replace(/\b\d+\b/g, "")
    .replace(new RegExp(`\\b(${Object.keys(QUALITY_HINT).join("|")})\\b`, "gi"), "")
    .replace(/\s+/g, " ")
    .trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function hintFor(name) {
  const key = Object.keys(QUALITY_HINT).find((k) => name.toLowerCase().includes(k));
  return key ? QUALITY_HINT[key] : "Sample document";
}

function isPdf(file) {
  return file && (file.type === "application/pdf" || /\.pdf$/i.test(file.name));
}

export default function DocumentPicker({ samples, sample, setSample, file, setFile }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const previewUrl = file && !isPdf(file) ? URL.createObjectURL(file) : !file && sample ? sampleUrl(sample) : null;

  const options = samples.map((name) => ({
    value: name,
    label: prettify(name),
    hint: hintFor(name),
  }));

  function pickFile(f) {
    if (!f) return;
    setFile(f);
  }

  function clearFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-navy">Document</h2>
        <span className="text-xs text-gray-400">PNG · JPG · PDF</span>
      </div>

      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-navy/20 bg-navy/5 p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
            <FileText size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy">{file.name}</p>
            <p className="text-xs text-gray-400">
              {isPdf(file) ? "PDF · first page will be read" : "Uploaded image"}
            </p>
          </div>
          <button
            onClick={clearFile}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-white hover:text-navy"
            aria-label="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pickFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
            dragOver ? "border-navy bg-navy/5" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/60"
          }`}
        >
          <UploadCloud size={22} className={dragOver ? "text-navy" : "text-gray-400"} />
          <span className="mt-1.5 text-sm font-medium text-gray-600">
            Drop a file, or <span className="text-navy underline">browse</span>
          </span>
          <span className="mt-0.5 text-xs text-gray-400">Your own superbill or discharge summary</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={(e) => pickFile(e.target.files?.[0])}
      />

      {previewUrl && (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
          <img src={previewUrl} alt="Selected document" className="max-h-80 w-full object-contain" />
        </div>
      )}

      <div className="mt-5 border-t border-gray-100 pt-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
          Or try a sample document
        </label>
        <Select
          value={file ? null : sample}
          onChange={(v) => {
            setSample(v);
            clearFile();
          }}
          options={options}
          placeholder="Choose a sample…"
          icon={FolderOpen}
        />
        <p className="mt-2 text-xs text-gray-400">
          Synthetic documents at varying scan quality — no real patient data.
        </p>
      </div>
    </div>
  );
}
