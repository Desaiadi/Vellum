import { useEffect, useState } from "react";
import { FileScan, Layers, Loader2, MessageSquareText, Sparkles } from "lucide-react";
import Sidebar from "./components/Sidebar";
import DocumentPicker from "./components/DocumentPicker";
import ExtractionResult from "./components/ExtractionResult";
import BatchUploader from "./components/BatchUploader";
import ReviewQueue from "./components/ReviewQueue";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import ReportSummaryBox from "./components/ReportSummaryBox";
import ChatWidget from "./components/ChatWidget";
import { listSamples, extract, extractBatch } from "./api";

const TABS = [
  { id: "extract", label: "Extract", icon: FileScan },
  { id: "batch", label: "Batch", icon: Layers },
  { id: "report", label: "About the Report", icon: MessageSquareText },
];

function ResultSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
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
  const [tab, setTab] = useState("extract");

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
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-navy text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber text-navy">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="font-serif-head text-xl font-bold leading-none tracking-wide">VELLUM</h1>
              <p className="text-[11px] text-ice">Clinical Chart Coding, Reimagined</p>
            </div>
          </div>
          <nav className="flex gap-1 rounded-full bg-white/10 p-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    tab === t.id ? "bg-amber text-navy" : "text-white/80 hover:text-white"
                  }`}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {tab === "extract" && (
          <div className="flex flex-col gap-6 lg:flex-row">
            <Sidebar
              backend={backend}
              setBackend={setBackend}
              showComparison={showComparison}
              setShowComparison={setShowComparison}
              deid={deid}
              setDeid={setDeid}
            />
            <div className="flex-1 space-y-5">
              <DocumentPicker samples={samples} sample={sample} setSample={setSample} file={file} setFile={setFile} />
              <button
                onClick={runExtract}
                disabled={running || (!file && !sample)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber py-3 text-sm font-bold text-navy transition hover:brightness-95 disabled:opacity-40"
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
                  <div className="mx-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                    Comparison: conventional OCR + text-LLM pipeline
                  </div>
                  <ExtractionResult result={classicResult} showDeid={deid} />
                </>
              )}
            </div>
          </div>
        )}

        {tab === "batch" && (
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
              <BatchUploader files={batchFiles} setFiles={setBatchFiles} onRun={runBatch} running={batchRunning} />
            </div>
            <div className="flex-1 space-y-6">
              <AnalyticsDashboard results={batchResults} />
              <ReviewQueue results={batchResults} showDeid={deid} />
            </div>
          </div>
        )}

        {tab === "report" && <ReportSummaryBox />}
      </main>

      <ChatWidget />
    </div>
  );
}
