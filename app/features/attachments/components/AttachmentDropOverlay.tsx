import { Upload } from 'lucide-react';

export interface AttachmentDropOverlayProps {
  isDragging: boolean;
}

export function AttachmentDropOverlay({
  isDragging,
}: AttachmentDropOverlayProps) {
  if (!isDragging) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-stack-bg/85 backdrop-blur-[2px] border-2 border-dashed border-red-500/70 p-6 pointer-events-none transition-all">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-950/40 border border-red-800/60 mb-4 animate-bounce">
        <Upload className="h-8 w-8 text-red-400" />
      </div>
      <h3 className="text-sm font-mono font-semibold tracking-wider text-stack-bone uppercase mb-1">
        Drop files to attach
      </h3>
      <p className="text-xs font-mono text-stack-steel text-center max-w-sm">
        Images will be optimized to WebP. Documents are stored locally and
        inserted as Markdown.
      </p>
    </div>
  );
}
