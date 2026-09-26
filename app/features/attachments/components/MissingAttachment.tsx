import { ImageOff } from 'lucide-react';

export interface MissingAttachmentProps {
  path?: string;
  alt?: string;
}

export function MissingAttachment({ path, alt }: MissingAttachmentProps) {
  return (
    <span className="my-2 flex items-center gap-2.5 rounded border border-dashed border-red-500/40 bg-red-950/20 px-3 py-2 text-xs font-mono text-red-300">
      <ImageOff className="h-4 w-4 shrink-0 text-red-400" />
      <span className="flex-1 truncate">
        Missing image:{' '}
        <code className="text-red-200">{path || alt || 'unknown'}</code>
      </span>
      <span className="text-[10px] text-red-400/80 uppercase tracking-wider">
        Not found
      </span>
    </span>
  );
}
