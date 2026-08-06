import ReactMarkdown from "react-markdown";

/**
 * Chat/answer text renderer. Assistant replies come back as light markdown
 * (short paragraphs, bold labels, the occasional list) — rendering it is far
 * more readable than showing raw ** ** in a wall of text.
 *
 * `tone="dark"` is for bubbles on a navy background.
 */
export default function Markdown({ children, tone = "light" }) {
  const strong = tone === "dark" ? "text-white" : "text-navy";
  const code =
    tone === "dark"
      ? "bg-white/15 text-white"
      : "bg-navy/8 text-navy";

  return (
    <div className="space-y-2.5 text-[13.5px] leading-relaxed">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="whitespace-pre-line">{children}</p>,
          strong: ({ children }) => (
            <strong className={`font-semibold ${strong}`}>{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="ml-1 list-none space-y-1.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="ml-4 list-decimal space-y-1.5 marker:font-semibold">
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => {
            // unordered items get a custom bullet; ordered keep their marker
            const ordered = props.node?.parentNode?.tagName === "ol";
            return ordered ? (
              <li className="pl-1">{children}</li>
            ) : (
              <li className="relative pl-4 before:absolute before:left-0 before:top-[0.6em] before:h-1 before:w-1 before:rounded-full before:bg-amber">
                {children}
              </li>
            );
          },
          code: ({ children }) => (
            <code className={`rounded px-1 py-0.5 font-mono text-[0.85em] ${code}`}>
              {children}
            </code>
          ),
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="underline">
              {children}
            </a>
          ),
          h1: ({ children }) => (
            <p className={`font-semibold ${strong}`}>{children}</p>
          ),
          h2: ({ children }) => (
            <p className={`font-semibold ${strong}`}>{children}</p>
          ),
          h3: ({ children }) => (
            <p className={`font-semibold ${strong}`}>{children}</p>
          ),
          hr: () => <hr className="border-current opacity-15" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
