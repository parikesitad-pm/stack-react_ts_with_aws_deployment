import { MarkdownRenderer } from './MarkdownRenderer';

export interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({
  content,
  className = '',
}: MarkdownPreviewProps) {
  return (
    <div className={`p-6 max-w-4xl mx-auto ${className}`}>
      <MarkdownRenderer content={content} />
    </div>
  );
}
