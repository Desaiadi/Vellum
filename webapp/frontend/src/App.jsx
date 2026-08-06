import { useEffect, useState } from "react";
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
  { id: "extract", label: "Extract" },
  { id: "batch", label: "Batch" },
  { id: "report", label: "About the Report" },
];

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
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="font-serif-head text-2xl font-bold tracking-wide">VELLUM</h1>
            <p className="text-xs text-ice">Clinical Chart Coding, Reimagined</p>
          </div>
          <nav className="flex gap-1 rounded-full bg-white/10 p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  tab === t.id ? "bg-amber text-navy" : "text-white/80 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
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
                className="w-full rounded-xl bg-amber py-3 text-sm font-bold text-navy transition hover:brightness-95 disabled:opacity-40"
              >
                {running ? "Extracting…" : "Extract structured record"}
              </button>
              {runError && <p className="text-sm text-bad">{runError}</p>}
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
