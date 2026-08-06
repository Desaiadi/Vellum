export default function BatchUploader({ files, setFiles, onRun, running }) {
  function onSelect(e) {
    setFiles(Array.from(e.target.files || []));
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-navy">
        Batch upload
      </h2>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 px-4 py-8 text-center hover:border-navy">
        <span className="text-sm font-medium text-gray-500">
          Click to select multiple images
        </span>
        <span className="mt-1 text-xs text-gray-400">PNG or JPG, any number of files</span>
        <input type="file" accept="image/png,image/jpeg" multiple className="hidden" onChange={onSelect} />
      </label>

      {files.length > 0 && (
        <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm text-gray-600">
          {files.map((f, i) => (
            <li key={i} className="truncate">
              {f.name}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onRun}
        disabled={files.length === 0 || running}
        className="mt-4 w-full rounded-xl bg-navy py-2.5 text-sm font-semibold text-white transition hover:bg-navy-dark disabled:opacity-40"
      >
        {running ? "Processing…" : `Process ${files.length || ""} document${files.length === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}
