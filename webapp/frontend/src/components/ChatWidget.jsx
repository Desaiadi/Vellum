import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import Markdown from "./Markdown";
import { sendChat } from "../api";

const SUGGESTIONS = [
  "What is this project and who built it?",
  "What doesn't Vellum do?",
  "Explain the 15.2% concordance stat simply",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I can answer questions about Vellum, the written report, or the builder's background. Ask me anything — or tap a suggestion below.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function send(text) {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    const history = messages;
    setMessages((m) => [...m, { role: "user", content: message }]);
    setInput("");
    setSending(true);
    try {
      const reply = await sendChat(message, history);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 sm:w-96">
          <div className="flex items-center justify-between bg-navy px-4 py-3">
            <span className="flex items-center gap-2 font-serif-head font-bold text-white">
              <Sparkles size={16} className="text-amber" />
              Ask about Vellum
            </span>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div
                  key={i}
                  className="ml-auto max-w-[85%] rounded-2xl bg-navy px-3 py-2 text-sm text-white"
                >
                  {m.content}
                </div>
              ) : (
                <div
                  key={i}
                  className="max-w-[92%] rounded-2xl bg-gray-100 px-3.5 py-2.5 text-gray-800"
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
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:border-navy hover:text-navy"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2 border-t border-gray-100 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="flex-1 rounded-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-navy"
            />
            <button
              type="submit"
              disabled={sending}
              className="flex items-center justify-center rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-amber text-navy shadow-xl transition hover:scale-105"
        aria-label="Open chat"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
}
