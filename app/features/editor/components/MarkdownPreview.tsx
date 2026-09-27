import { MarkdownRenderer } from './MarkdownRenderer';

export interface MarkdownPreviewProps {
  content: string;
  className?: string;
  noteId?: string;
}

export function MarkdownPreview({
  content,
  className = '',
  noteId,
}: MarkdownPreviewProps) {
  return (
    <div className={`p-6 max-w-4xl mx-auto ${className}`}>
      <MarkdownRenderer content={content} noteId={noteId} />
    </div>
  );
}
