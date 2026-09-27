import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MarkdownImage } from '~/features/attachments/components/MarkdownImage';
import { AttachmentLink } from '~/features/attachments/components/AttachmentLink';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = '',
}: MarkdownRendererProps) {
  return (
    <div
      className={`prose prose-invert max-w-none text-stack-bone font-sans leading-relaxed selection:bg-stack-metal selection:text-stack-bone ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt, ...props }) => (
            <MarkdownImage src={src} alt={alt} {...props} />
          ),
          h1: ({ children, ...props }) => (
            <h1
              className="mt-6 mb-4 text-2xl font-bold font-mono tracking-tight text-stack-bone border-b border-stack-metal/60 pb-2"
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              className="mt-5 mb-3 text-xl font-semibold font-mono tracking-tight text-stack-bone border-b border-stack-metal/40 pb-1.5"
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              className="mt-4 mb-2 text-lg font-semibold font-mono text-stack-silver"
              {...props}
            >
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4
              className="mt-3 mb-1.5 text-base font-medium font-mono text-stack-silver"
              {...props}
            >
              {children}
            </h4>
          ),
          p: ({ children, ...props }) => (
            <p
              className="my-2.5 text-sm leading-relaxed text-stack-silver"
              {...props}
            >
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul
              className="my-2.5 ml-5 list-disc space-y-1 text-sm text-stack-silver"
              {...props}
            >
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol
              className="my-2.5 ml-5 list-decimal space-y-1 text-sm text-stack-silver"
              {...props}
            >
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-relaxed" {...props}>
              {children}
            </li>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="my-3 border-l-2 border-stack-steel/60 pl-3 italic text-stack-steel font-mono text-xs"
              {...props}
            >
              {children}
            </blockquote>
          ),
          code: ({
            inline,
            className: codeClassName,
            children,
            ...props
          }: any) => {
            if (inline) {
              return (
                <code
                  className="rounded bg-stack-surface-raised border border-stack-metal/60 px-1 py-0.5 font-mono text-xs text-stack-bone"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={codeClassName} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <div className="my-4 rounded border border-stack-metal bg-stack-bg p-3 font-mono text-xs overflow-x-auto">
              <pre className="text-stack-bone leading-relaxed" {...props}>
                {children}
              </pre>
            </div>
          ),
          table: ({ children, ...props }) => (
            <div className="my-4 overflow-x-auto">
              <table
                className="w-full border-collapse border border-stack-metal text-left font-mono text-xs"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead
              className="bg-stack-surface-raised text-stack-bone"
              {...props}
            >
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th
              className="border border-stack-metal px-3 py-1.5 font-semibold text-stack-bone"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td
              className="border border-stack-metal/40 px-3 py-1.5 text-stack-silver"
              {...props}
            >
              {children}
            </td>
          ),
          a: ({ children, href, ...props }) => (
            <AttachmentLink href={href} {...props}>
              {children}
            </AttachmentLink>
          ),
          hr: () => <hr className="my-6 border-stack-metal/60" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
