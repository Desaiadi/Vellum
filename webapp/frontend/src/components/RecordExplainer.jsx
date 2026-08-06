import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  HeartPulse,
  Info,
  Loader2,
  MessageCircleQuestion,
  Send,
  Stethoscope,
} from "lucide-react";
import DocInput from "./DocInput";
import Markdown from "./Markdown";
import { explainRecord, consultRecord } from "../api";

const STATUS_STYLE = {
  normal: { chip: "bg-good text-white", label: "in range" },
  borderline: { chip: "bg-amber-dark text-white", label: "borderline" },
  outside_range: { chip: "bg-bad text-white", label: "outside range" },
  unclear: { chip: "bg-gray-400 text-white", label: "unclear" },
  not_applicable: { chip: "bg-gray-200 text-gray-600", label: "—" },
};

const URGENCY = {
  routine: {
    label: "Routine",
    body: "Nothing here reads as time-sensitive.",
    cls: "bg-good/10 text-good ring-good/20",
  },
  discuss_at_next_visit: {
    label: "Discuss at your next visit",
    body: "Worth raising, but not urgent based on what's written.",
    cls: "bg-navy/5 text-navy ring-navy/15",
  },
  contact_clinician_soon: {
    label: "Contact your clinician soon",
    body: "Some results here warrant follow-up sooner rather than later.",
    cls: "bg-amber/15 text-amber-dark ring-amber/30",
  },
  seek_care_now: {
    label: "Seek care promptly",
    body: "Something in this document may need prompt medical attention.",
    cls: "bg-bad/10 text-bad ring-bad/25",
  },
};

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 ${className}`}>
      {children}
    </div>
  );
}

function Disclaimer({ text }) {
  return (
    <div className="flex gap-2.5 rounded-xl bg-navy/5 p-3.5 text-xs leading-relaxed text-navy/80">
      <Info size={15} className="mt-0.5 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

function ConsultPanel({ recordText }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "I've read through your document. Ask me anything about it — what a term means, why a number matters, or what you might want to raise with your clinician.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function send(q) {
    const question = (q ?? input).trim();
    if (!question || sending) return;
    const history = messages;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setSending(true);
    try {
      const reply = await consultRecord({ question, recordText, history });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <h3 className="mb-1 flex items-center gap-2 font-display text-lg font-bold text-navy">
        <MessageCircleQuestion size={18} className="text-amber" />
        Ask about your results
      </h3>
      <p className="mb-4 text-sm text-gray-500">
        Follow-up questions, answered from your document.
      </p>

      <div ref={scrollRef} className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div
              key={i}
              className="ml-auto max-w-[88%] rounded-2xl bg-navy px-3.5 py-2.5 text-sm leading-relaxed text-white"
            >
              {m.content}
            </div>
          ) : (
            <div
              key={i}
              className="max-w-[92%] rounded-2xl bg-gray-100 px-4 py-3 text-gray-800"
            >
              <Markdown>{m.content}</Markdown>
            </div>
          ),
        )}
        {sending && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Loader2 size={12} className="animate-spin" /> Thinking…
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. why is my A1c important?"
          className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-navy"
        />
        <button
          type="submit"
          disabled={sending}
          className="flex items-center justify-center rounded-full bg-navy px-4 py-2.5 text-white transition hover:bg-navy-dark disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </form>
    </Card>
  );
}

export default function RecordExplainer() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  async function run() {
    setRunning(true);
    setError(null);
    setData(null);
    try {
      setData(await explainRecord({ file, text }));
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  const urgency = data ? URGENCY[data.urgency] || URGENCY.routine : null;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Card>
        <DocInput
          label="Your medical record or lab report"
          hint="Nothing is stored — the document stays in this browser session only."
          file={file}
          setFile={setFile}
          text={text}
          setText={setText}
          rows={9}
        />
      </Card>

      <button
        onClick={run}
        disabled={running || (!file && !text.trim())}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber py-3.5 text-sm font-bold text-navy shadow-lg shadow-amber/20 transition hover:brightness-105 disabled:opacity-40 disabled:shadow-none"
      >
        {running ? <Loader2 size={16} className="animate-spin" /> : <Stethoscope size={16} />}
        {running ? "Reading your document…" : "Explain this to me"}
      </button>

      {error && (
        <p className="rounded-xl bg-bad/5 px-4 py-3 text-sm font-medium text-bad ring-1 ring-bad/20">
          {error}
        </p>
      )}

      {data && (
        <>
          <Card>
            <span className="text-xs font-bold uppercase tracking-wide text-amber-dark">
              {data.document_type}
            </span>
            <h3 className="mt-1.5 font-display text-xl font-bold text-navy">
              What this document says
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-700">{data.plain_summary}</p>

            {urgency && (
              <div className={`mt-5 rounded-xl px-4 py-3 ring-1 ${urgency.cls}`}>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <AlertTriangle size={15} />
                  {urgency.label}
                </div>
                <p className="mt-1 text-sm">{data.urgency_reason}</p>
              </div>
            )}

            <div className="mt-5">
              <Disclaimer text={data.disclaimer} />
            </div>
          </Card>

          {data.findings?.length > 0 && (
            <Card>
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-navy">
                <Activity size={18} className="text-amber" />
                Your results, one by one
              </h3>
              <div className="space-y-3">
                {data.findings.map((f, i) => {
                  const s = STATUS_STYLE[f.status] || STATUS_STYLE.unclear;
                  return (
                    <div key={i} className="rounded-xl border border-gray-100 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-navy">{f.label}</span>
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-sm text-gray-700">{f.value}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.chip}`}
                          >
                            {s.label}
                          </span>
                        </span>
                      </div>
                      {f.reference_range !== "not stated" && (
                        <p className="mt-0.5 text-xs text-gray-400">
                          Normal range: {f.reference_range}
                        </p>
                      )}
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium text-navy">What it is: </span>
                        {f.what_it_measures}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        <span className="font-medium text-navy">Your result: </span>
                        {f.plain_meaning}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {data.possible_explanations?.length > 0 && (
            <Card>
              <h3 className="mb-1 flex items-center gap-2 font-display text-lg font-bold text-navy">
                <HeartPulse size={18} className="text-amber" />
                What could explain this
              </h3>
              <p className="mb-4 text-sm text-gray-500">
                General possibilities a clinician would consider — not a diagnosis of you.
              </p>
              <div className="space-y-3">
                {data.possible_explanations.map((p, i) => (
                  <div key={i} className="border-l-2 border-amber pl-3.5">
                    <p className="text-sm font-semibold text-navy">{p.explanation}</p>
                    <p className="mt-0.5 text-sm text-gray-600">{p.why_it_fits}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {data.questions_for_your_doctor?.length > 0 && (
            <Card className="!bg-navy !ring-0">
              <h3 className="mb-4 font-display text-lg font-bold text-white">
                Questions to bring to your appointment
              </h3>
              <ol className="space-y-2.5">
                {data.questions_for_your_doctor.map((q, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-ice">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber text-[11px] font-bold text-navy">
                      {i + 1}
                    </span>
                    {q}
                  </li>
                ))}
              </ol>
            </Card>
          )}

          <ConsultPanel recordText={data.source_text} />
        </>
      )}
    </div>
  );
}
