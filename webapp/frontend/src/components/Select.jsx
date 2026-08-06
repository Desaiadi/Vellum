import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

/** Accessible-ish custom select. options: [{ value, label, hint }] */
export default function Select({ value, onChange, options, placeholder = "Select…", icon: Icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-3.5 py-2.5 text-left transition ${
          open ? "border-navy ring-2 ring-navy/10" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {Icon && <Icon size={16} className="shrink-0 text-gray-400" />}
          <span className="min-w-0">
            <span className={`block truncate text-sm ${selected ? "font-medium text-navy" : "text-gray-400"}`}>
              {selected ? selected.label : placeholder}
            </span>
            {selected?.hint && (
              <span className="block truncate text-xs text-gray-400">{selected.hint}</span>
            )}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul className="animate-fade absolute z-30 mt-1.5 max-h-72 w-full overflow-auto rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl">
          {options.map((o) => {
            const active = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    active ? "bg-navy/5 text-navy" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{o.label}</span>
                    {o.hint && <span className="block truncate text-xs text-gray-400">{o.hint}</span>}
                  </span>
                  {active && <Check size={15} className="shrink-0 text-navy" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
