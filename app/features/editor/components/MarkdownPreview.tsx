import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className = "" }: MarkdownPreviewProps) {
  return (
    <div className={`prose prose-invert max-w-none px-6 py-4 font-mono text-xs text-stack-silver leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-6 mb-3 font-mono text-xl font-bold tracking-tight text-stack-bone border-b border-stack-metal/50 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-5 mb-2 font-mono text-base font-bold tracking-tight text-stack-bone">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 mb-2 font-mono text-sm font-semibold text-stack-silver">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-2 leading-relaxed text-stack-silver">
              {children}
            </p>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-stack-red-slate bg-stack-surface-raised/50 py-1.5 pl-3.5 pr-2 italic text-stack-silver">
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const match = /language-(\w+)/.exec(codeClassName || "");
            const isInline = !match && !String(children).includes("\n");
            if (isInline) {
              return (
                <code
                  className="rounded border border-stack-metal/70 bg-stack-bg px-1.5 py-0.5 font-mono text-[11px] text-stack-bone"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="my-4 rounded border border-stack-metal bg-stack-bg p-3 font-mono text-xs">
                {match && (
                  <div className="mb-2 pb-1 border-b border-stack-metal/40 text-[10px] text-stack-steel uppercase tracking-wider">
                    {match[1]}
                  </div>
                )}
                <pre className="overflow-x-auto text-stack-bone leading-relaxed">
                  <code>{children}</code>
                </pre>
              </div>
            );
          },
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse border border-stack-metal text-left font-mono text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-stack-surface-raised text-stack-bone">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="border border-stack-metal px-3 py-1.5 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-stack-metal/40 px-3 py-1.5 text-stack-silver">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="border border-stack-metal/60 odd:bg-stack-surface/40 hover:bg-stack-surface">
              {children}
            </tr>
          ),
          ul: ({ children }) => (
            <ul className="my-2 ml-5 list-disc space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 ml-5 list-decimal space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="my-0.5 text-stack-silver">
              {children}
            </li>
          ),
          hr: () => <hr className="my-4 border-stack-metal/60" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
