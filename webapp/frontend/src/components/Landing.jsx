import {
  ArrowRight,
  BadgeCheck,
  Braces,
  FileScan,
  Layers,
  Play,
  ScanLine,
  ScrollText,
  Sparkles,
  Stethoscope,
  X,
} from "lucide-react";

const STATS = [
  {
    value: "15.2%",
    label: "Best-case LLM agreement with certified ICD-10 coders",
    source: "Simmons et al., 2025",
  },
  {
    value: "1.47%",
    label: "Measured hallucination rate in LLM-generated clinical text",
    source: "Kim et al., 2025",
  },
  {
    value: "6.26%",
    label: "Persistent claims-error rate across the healthcare system",
    source: "Grigalashvili, 2026",
  },
];

const FEATURES = [
  {
    icon: ScanLine,
    title: "Bills and charts, coded",
    body: "Reads a superbill or discharge summary and returns the patient, provider, diagnoses, and procedures with the right billing codes attached.",
  },
  {
    icon: BadgeCheck,
    title: "It tells you when it's unsure",
    body: "Every field gets a confidence score, and anything ambiguous is flagged for a person to check before it goes anywhere.",
  },
  {
    icon: Layers,
    title: "Whole stacks at a time",
    body: "Drop in a pile of documents and get back a worklist — flagged records first, with confidence tracked across the batch.",
  },
  {
    icon: ScrollText,
    title: "Policies made readable",
    body: "Summarizes billing policies, clinical guidelines, and payer contracts, and shows exactly what changed between two versions.",
  },
  {
    icon: Braces,
    title: "Policy turned into code",
    body: "Converts written coverage rules into runnable logic — JSON rules, Python, SQL, or model features — with honest notes on what's too vague to encode.",
  },
  {
    icon: Stethoscope,
    title: "Your own records, explained",
    body: "Upload a lab report and get it in plain language: what each result means, what could explain it, and what to ask your doctor.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Drop in a document",
    body: "A scanned superbill or discharge summary — PNG, JPG, or PDF, at any scan quality.",
  },
  {
    n: "02",
    title: "One multimodal call",
    body: "The model reads layout and text together and returns a structured record with ICD-10 and CPT codes.",
  },
  {
    n: "03",
    title: "Review what's flagged",
    body: "Confidence scores and review flags route uncertain lines to a human coder before anything is billed.",
  },
];

function PipelineCompare() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Conventional
          </span>
        </div>
        <div className="flex items-center gap-2">
          {["OCR", "NER", "Normalize"].map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-3 text-center text-xs font-semibold text-gray-500">
                {s}
              </div>
              {i < 2 && <ArrowRight size={14} className="shrink-0 text-gray-300" />}
            </div>
          ))}
        </div>
        <ul className="mt-5 space-y-2 text-sm text-gray-500">
          <li className="flex gap-2">
            <X size={15} className="mt-0.5 shrink-0 text-bad" />
            Layout and handwriting nuance is lost at the OCR handoff.
          </li>
          <li className="flex gap-2">
            <X size={15} className="mt-0.5 shrink-0 text-bad" />
            Three systems to build, tune, and maintain.
          </li>
          <li className="flex gap-2">
            <X size={15} className="mt-0.5 shrink-0 text-bad" />
            Errors compound stage over stage.
          </li>
        </ul>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-navy bg-navy p-6 text-white">
        <div className="mesh pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative">
          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-full bg-amber px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-navy">
              Vellum
            </span>
          </div>
          <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-3 text-center text-xs font-semibold backdrop-blur-sm">
            One multimodal call
          </div>
          <ul className="mt-5 space-y-2 text-sm text-ice">
            <li className="flex gap-2">
              <BadgeCheck size={15} className="mt-0.5 shrink-0 text-amber" />
              Reads layout, text, and scan quality together.
            </li>
            <li className="flex gap-2">
              <BadgeCheck size={15} className="mt-0.5 shrink-0 text-amber" />
              Returns a structured, coded record in one pass.
            </li>
            <li className="flex gap-2">
              <BadgeCheck size={15} className="mt-0.5 shrink-0 text-amber" />
              Flags its own uncertainty for human review.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Landing({ onStart, onOpenReport }) {
  return (
    <div className="animate-fade">
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden bg-navy-deep text-white">
        <div className="mesh pointer-events-none absolute inset-0" />
        <div className="grid-lines pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-ice backdrop-blur-sm">
                <Sparkles size={13} className="text-amber" />
                AI for clinical documents
              </span>

              <h1 className="animate-rise mt-6 font-display text-[2.6rem] font-bold leading-[1.1] tracking-tight sm:text-5xl xl:text-[3.35rem]">
                Clinical documents in.
                <br />
                <span className="text-amber">Clear answers out.</span>
              </h1>

              <p className="animate-rise mt-6 max-w-xl text-lg leading-relaxed text-ice/90">
                Healthcare runs on paperwork — bills, discharge summaries, lab
                results, policy manuals. Vellum reads them the way a person
                would, pulls out what actually matters, and is honest about
                what it isn't sure of.
              </p>

              <div className="animate-rise mt-9 flex flex-wrap items-center gap-3">
                <button
                  onClick={onStart}
                  className="group flex items-center gap-2 rounded-xl bg-amber px-6 py-3.5 text-sm font-bold text-navy shadow-lg shadow-amber/20 transition hover:brightness-105"
                >
                  <Play size={16} />
                  Try the live demo
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </button>
                <button
                  onClick={onOpenReport}
                  className="rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Read the findings
                </button>
              </div>

              <p className="mt-5 text-xs text-ice/60">
                Runs on Claude, or fully offline on a local model. All sample
                documents are synthetic — no real patient data, ever.
              </p>
            </div>

            {/* Product preview card */}
            <div className="animate-rise relative">
              <div className="absolute -inset-4 rounded-3xl bg-amber/10 blur-2xl" />
              <div className="relative rounded-2xl bg-white p-5 shadow-2xl">
                <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="font-display text-sm font-bold text-navy">
                    Extracted record
                  </span>
                  <span className="rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-dark">
                    2 flagged
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                      Patient
                    </div>
                    <div className="truncate text-xs font-semibold text-navy">
                      D. Castellano
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                      Date of service
                    </div>
                    <div className="text-xs font-semibold text-navy">01/11/2026</div>
                  </div>
                </div>

                {[
                  { d: "Sprain of ACL, right knee", c: "S83.511A", lv: "high" },
                  { d: "Joint pain, right knee", c: "M25.561", lv: "high" },
                  { d: "Office visit, new patient", c: "99204", lv: "medium" },
                  { d: "Knee immobilizer fitting", c: "29515", lv: "low" },
                ].map((r) => (
                  <div
                    key={r.c}
                    className="flex items-center justify-between gap-2 border-b border-gray-50 py-2 last:border-0"
                  >
                    <span className="truncate text-xs text-gray-700">{r.d}</span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="font-mono text-[10px] text-gray-400">{r.c}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white ${
                          r.lv === "high"
                            ? "bg-good"
                            : r.lv === "medium"
                              ? "bg-amber-dark"
                              : "bg-bad"
                        }`}
                      >
                        {r.lv}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Stats ---------------- */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.value}>
              <div className="font-display text-4xl font-bold text-navy">{s.value}</div>
              <p className="mt-1.5 text-sm leading-snug text-gray-600">{s.label}</p>
              <p className="mt-1 text-xs italic text-gray-400">{s.source}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- The shift ---------------- */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-dark">
            The shift
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-navy sm:text-4xl">
            Fewer stages, fewer places to lose the meaning
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
            Every handoff in a document pipeline is a place where information
            gets dropped and errors compound. Collapsing the pipeline into one
            model that sees the page the way a person does removes those seams
            entirely.
          </p>
        </div>
        <PipelineCompare />
      </section>

      {/* ---------------- Features ---------------- */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-dark">
              What's inside
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-navy sm:text-4xl">
              Six things it does, one thing it won't
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
              It won't pretend to be certain. Research shows today's models
              can't be trusted to code a chart or read a scan unsupervised, so
              everything here is built to hand a person the decision — with the
              work already done and the doubts already marked.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-gray-100 bg-paper p-6 transition hover:border-navy/20 hover:shadow-lg"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-white transition group-hover:bg-amber group-hover:text-navy">
                    <Icon size={19} />
                  </div>
                  <h3 className="mt-4 font-semibold text-navy">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-dark">
            How it works
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-navy sm:text-4xl">
            Three steps, about eight seconds
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-black/5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-navy font-display text-sm font-bold text-amber">
                {s.n}
              </span>
              <h3 className="mt-4 font-semibold text-navy">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="mesh pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            See it read a degraded scan
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ice/90">
            Three synthetic documents are bundled in — clean, lightly noisy, and
            visibly blurred — so you can watch the confidence scores move with
            the quality of the page.
          </p>
          <button
            onClick={onStart}
            className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-amber px-7 py-3.5 text-sm font-bold text-navy shadow-lg shadow-amber/20 transition hover:brightness-105"
          >
            <FileScan size={16} />
            Open the extractor
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-gray-400 sm:flex-row">
          <span>
            Vellum — a proof of concept by Aditya Desai for the Cotiviti intern
            assessment.
          </span>
          <span>
            Illustrative codes only · not a certified coding determination
          </span>
        </div>
      </footer>
    </div>
  );
}
