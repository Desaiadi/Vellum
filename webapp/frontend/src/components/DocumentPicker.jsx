import { sampleUrl } from "../api";

export default function DocumentPicker({ samples, sample, setSample, file, setFile }) {
  const previewUrl = file ? URL.createObjectURL(file) : sample ? sampleUrl(sample) : null;

  function onUpload(e) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setSample(null);
    }
  }

  function onPickSample(name) {
    setSample(name);
    setFile(null);
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-navy">Document</h2>
      <div className="flex flex-wrap gap-2">
        {samples.map((name) => (
          <button
            key={name}
            onClick={() => onPickSample(name)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              sample === name
                ? "border-navy bg-navy text-white"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {name.replace(/\.png$/, "").replace(/_/g, " ")}
          </button>
        ))}
        <label className="cursor-pointer rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-navy hover:text-navy">
          Upload image…
          <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={onUpload} />
        </label>
      </div>

      {previewUrl && (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
          <img src={previewUrl} alt="Selected document" className="max-h-96 w-full object-contain bg-gray-50" />
        </div>
      )}
    </div>
  );
}
