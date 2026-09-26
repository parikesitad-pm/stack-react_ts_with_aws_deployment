import { useMemo } from 'react';

export interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({
  content,
  className = '',
}: MarkdownPreviewProps) {
  const renderedElements = useMemo(() => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockLang = '';
    let codeBuffer: string[] = [];
    let inTable = false;
    let tableBuffer: string[] = [];

    const flushCodeBlock = (key: string) => {
      elements.push(
        <div
          key={key}
          className="my-4 rounded border border-stack-metal bg-stack-bg p-3 font-mono text-xs"
        >
          {codeBlockLang && (
            <div className="mb-2 pb-1 border-b border-stack-metal/40 text-[10px] text-stack-steel uppercase tracking-wider">
              {codeBlockLang}
            </div>
          )}
          <pre className="overflow-x-auto text-stack-bone leading-relaxed">
            {codeBuffer.join('\n')}
          </pre>
        </div>
      );
      codeBuffer = [];
      inCodeBlock = false;
      codeBlockLang = '';
    };

    const flushTable = (key: string) => {
      if (tableBuffer.length < 2) {
        tableBuffer = [];
        inTable = false;
        return;
      }
      const headerRow = tableBuffer[0] || '';
      const bodyRows = tableBuffer.slice(2);
      const headers = headerRow
        .split('|')
        .filter((c) => c.trim().length > 0)
        .map((c) => c.trim());

      elements.push(
        <div key={key} className="my-4 overflow-x-auto">
          <table className="w-full border-collapse border border-stack-metal text-left font-mono text-xs">
            <thead className="bg-stack-surface-raised text-stack-bone">
              <tr>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className="border border-stack-metal px-3 py-1.5 font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((r, ri) => {
                const cols = r
                  .split('|')
                  .filter((c) => c.trim().length > 0)
                  .map((c) => c.trim());
                return (
                  <tr
                    key={ri}
                    className="border border-stack-metal/60 odd:bg-stack-surface/40 hover:bg-stack-surface"
                  >
                    {cols.map((c, ci) => (
                      <td
                        key={ci}
                        className="border border-stack-metal/40 px-3 py-1.5 text-stack-silver"
                      >
                        {c}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      tableBuffer = [];
      inTable = false;
    };

    lines.forEach((line, idx) => {
      const key = `line-${idx}`;

      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock(key);
        } else {
          inCodeBlock = true;
          codeBlockLang = line.replace('```', '').trim();
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      // Tables
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        tableBuffer.push(line);
        return;
      } else if (inTable) {
        flushTable(`table-${idx}`);
      }

      // Headings
      if (line.startsWith('# ')) {
        elements.push(
          <h1
            key={key}
            className="mt-6 mb-3 font-mono text-xl font-bold tracking-tight text-stack-bone border-b border-stack-metal/50 pb-2"
          >
            {line.replace('# ', '')}
          </h1>
        );
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2
            key={key}
            className="mt-5 mb-2 font-mono text-base font-bold tracking-tight text-stack-bone"
          >
            {line.replace('## ', '')}
          </h2>
        );
        return;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3
            key={key}
            className="mt-4 mb-2 font-mono text-sm font-semibold text-stack-silver"
          >
            {line.replace('### ', '')}
          </h3>
        );
        return;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote
            key={key}
            className="my-3 border-l-2 border-stack-red-slate bg-stack-surface-raised/50 py-1.5 pl-3.5 pr-2 font-mono text-xs italic text-stack-silver"
          >
            {line.replace('> ', '')}
          </blockquote>
        );
        return;
      }

      // Checklists
      if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
        const checked = line.trim().startsWith('- [x]');
        const text = line.replace(/- \[[ x]\]\s*/, '');
        elements.push(
          <div
            key={key}
            className="my-1 flex items-center gap-2 font-mono text-xs text-stack-silver"
          >
            <span
              className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border ${checked ? 'border-stack-red-slate bg-stack-red-muted/40 text-stack-bone' : 'border-stack-metal bg-stack-surface'}`}
            >
              {checked ? '✓' : ''}
            </span>
            <span className={checked ? 'line-through text-stack-steel' : ''}>
              {text}
            </span>
          </div>
        );
        return;
      }

      // Bullet lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        elements.push(
          <li
            key={key}
            className="ml-4 list-disc font-mono text-xs text-stack-silver my-0.5"
          >
            {line.replace(/^[-*]\s+/, '')}
          </li>
        );
        return;
      }

      // Horizontal rule
      if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={key} className="my-4 border-stack-metal/60" />);
        return;
      }

      // Regular paragraph / empty line
      if (line.trim() === '') {
        elements.push(<div key={key} className="h-2" />);
      } else {
        elements.push(
          <p
            key={key}
            className="my-1.5 font-mono text-xs leading-relaxed text-stack-silver"
          >
            {line}
          </p>
        );
      }
    });

    if (inCodeBlock) flushCodeBlock('code-end');
    if (inTable) flushTable('table-end');

    return elements;
  }, [content]);

  return (
    <div className={`prose prose-invert max-w-none px-6 py-4 ${className}`}>
      {renderedElements}
    </div>
  );
}
