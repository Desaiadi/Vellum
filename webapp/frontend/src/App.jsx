import { useEffect, useState } from "react";
import {
  BookOpen,
  FileScan,
  Home,
  Layers,
  Loader2,
  ScrollText,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import Landing from "./components/Landing";
import PolicyWorkspace from "./components/PolicyWorkspace";
import RecordExplainer from "./components/RecordExplainer";
import About from "./components/About";
import Sidebar from "./components/Sidebar";
import DocumentPicker from "./components/DocumentPicker";
import ExtractionResult from "./components/ExtractionResult";
import BatchUploader from "./components/BatchUploader";
import ReviewQueue from "./components/ReviewQueue";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import ChatWidget from "./components/ChatWidget";
import { listSamples, extract, extractBatch } from "./api";

const TABS = [
  { id: "home", label: "Home", icon: Home },
  { id: "extract", label: "Extract", icon: FileScan },
  { id: "batch", label: "Batch", icon: Layers },
  { id: "policy", label: "Policy", icon: ScrollText },
  { id: "record", label: "My Record", icon: Stethoscope },
  { id: "about", label: "About", icon: BookOpen },
];

function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-7">
      <span className="text-xs font-bold uppercase tracking-widest text-amber-dark">
        {eyebrow}
      </span>
      <h1 className="mt-2 font-display text-3xl font-bold text-navy">{title}</h1>
      {subtitle && <p className="mt-2 max-w-2xl text-[15px] text-gray-600">{subtitle}</p>}
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="mb-4 h-5 w-64 rounded bg-gray-100" />
      <div className="mb-5 grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-3">
        <div className="h-10 rounded bg-gray-100" />
        <div className="h-10 rounded bg-gray-100" />
        <div className="h-10 rounded bg-gray-100" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-4 w-5/6 rounded bg-gray-100" />
        <div className="h-4 w-2/3 rounded bg-gray-100" />
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("home");

  // shared settings
  const [backend, setBackend] = useState("claude");
  const [showComparison, setShowComparison] = useState(false);
  const [deid, setDeid] = useState(false);

  // single-document state
  const [samples, setSamples] = useState([]);
  const [sample, setSample] = useState(null);
  const [file, setFile] = useState(null);
  const [running, setRunning] = useState(false);
  const [mmResult, setMmResult] = useState(null);
  const [classicResult, setClassicResult] = useState(null);
  const [runError, setRunError] = useState(null);

  // batch state
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchResults, setBatchResults] = useState([]);
  const [batchRunning, setBatchRunning] = useState(false);

  useEffect(() => {
    listSamples()
      .then((s) => {
        setSamples(s);
        if (s.length) setSample(s[0]);
      })
      .catch(() => {});
  }, []);

  function go(next) {
    setTab(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  async function runExtract() {
    if (!file && !sample) return;
    setRunning(true);
    setRunError(null);
    setMmResult(null);
    setClassicResult(null);
    try {
      const mm = await extract({ file, sample, backend, pipeline: "multimodal", deid });
      setMmResult(mm);
      if (showComparison) {
        const classic = await extract({ file, sample, backend, pipeline: "classic", deid });
        setClassicResult(classic);
      }
    } catch (e) {
      setRunError(e.message);
    } finally {
      setRunning(false);
    }
  }

  async function runBatch() {
    if (batchFiles.length === 0) return;
    setBatchRunning(true);
    try {
      const results = await extractBatch({ files: batchFiles, backend, pipeline: "multimodal", deid });
      setBatchResults(results);
    } catch (e) {
      setBatchResults([{ filename: "batch", error: e.message }]);
    } finally {
      setBatchRunning(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-deep/95 text-white backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <button onClick={() => go("home")} className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber text-navy">
              <Sparkles size={18} />
            </div>
            <div className="text-left">
              <h1 className="font-display text-xl font-bold leading-none tracking-wide">
                VELLUM
              </h1>
              <p className="text-[11px] text-ice/70">Clinical Chart Coding, Reimagined</p>
            </div>
          </button>

          <nav className="flex gap-0.5 rounded-full bg-white/10 p-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => go(t.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition sm:px-4 ${
                    tab === t.id ? "bg-amber text-navy" : "text-white/75 hover:text-white"
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="flex-1">
        {tab === "home" && (
          <Landing onStart={() => go("extract")} onOpenReport={() => go("about")} />
        )}

        {tab === "extract" && (
          <main className="animate-fade mx-auto max-w-6xl px-6 py-10">
            <PageHeader
              eyebrow="Billing & coding"
              title="Extract a structured record"
              subtitle="Upload a superbill or discharge summary and get back the patient, provider, diagnoses, and procedures — each with a confidence score and a flag when it needs a human to check."
            />
            <div className="flex flex-col gap-6 lg:flex-row">
              <Sidebar
                backend={backend}
                setBackend={setBackend}
                showComparison={showComparison}
                setShowComparison={setShowComparison}
                deid={deid}
                setDeid={setDeid}
              />
              <div className="min-w-0 flex-1 space-y-5">
                <DocumentPicker
                  samples={samples}
                  sample={sample}
                  setSample={setSample}
                  file={file}
                  setFile={setFile}
                />
                <button
                  onClick={runExtract}
                  disabled={running || (!file && !sample)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber py-3.5 text-sm font-bold text-navy shadow-lg shadow-amber/20 transition hover:brightness-105 disabled:opacity-40 disabled:shadow-none"
                >
                  {running && <Loader2 size={16} className="animate-spin" />}
                  {running ? "Extracting…" : "Extract structured record"}
                </button>
                {runError && (
                  <p className="rounded-xl bg-bad/5 px-4 py-3 text-sm font-medium text-bad ring-1 ring-bad/20">
                    {runError}
                  </p>
                )}
                {running && <ResultSkeleton />}
                {mmResult && <ExtractionResult result={mmResult} showDeid={deid} />}
                {classicResult && (
                  <>
                    <div className="mx-1 text-xs font-bold uppercase tracking-wide text-gray-400">
                      Comparison: conventional OCR + text-LLM pipeline
                    </div>
                    <ExtractionResult result={classicResult} showDeid={deid} />
                  </>
                )}
              </div>
            </div>
          </main>
        )}

        {tab === "batch" && (
          <main className="animate-fade mx-auto max-w-6xl px-6 py-10">
            <PageHeader
              eyebrow="Review queue"
              title="Process a stack at once"
              subtitle="Upload several documents and work them as a prioritized worklist — sorted by what the model flagged, with aggregate confidence across the whole batch."
            />
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="w-full space-y-6 lg:w-72">
                <Sidebar
                  backend={backend}
                  setBackend={setBackend}
                  showComparison={showComparison}
                  setShowComparison={setShowComparison}
                  deid={deid}
                  setDeid={setDeid}
                />
                <BatchUploader
                  files={batchFiles}
                  setFiles={setBatchFiles}
                  onRun={runBatch}
                  running={batchRunning}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-6">
                <AnalyticsDashboard results={batchResults} />
                <ReviewQueue results={batchResults} showDeid={deid} />
              </div>
            </div>
          </main>
        )}

        {tab === "policy" && (
          <main className="animate-fade mx-auto max-w-6xl px-6 py-10">
            <PageHeader
              eyebrow="Content management"
              title="Make sense of policy documents"
              subtitle="Billing and coding policies, clinical practice guidelines, and payer–provider contracts — summarized, diffed across versions, or turned into rules you can actually run."
            />
            <PolicyWorkspace />
          </main>
        )}

        {tab === "record" && (
          <main className="animate-fade mx-auto max-w-6xl px-6 py-10">
            <PageHeader
              eyebrow="For patients"
              title="Understand your own medical record"
              subtitle="Upload a lab report, visit summary, or medical record and get it explained in plain language — what each result means, what could generally explain it, and what to ask your clinician."
            />
            <RecordExplainer />
          </main>
        )}

        {tab === "about" && <About />}
      </div>

      <ChatWidget />
    </div>
  );
}
