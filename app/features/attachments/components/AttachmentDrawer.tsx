import {
  Paperclip,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Download,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { Attachment } from '../types/attachment.types';

interface AttachmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: Attachment[];
  onUploadClick: () => void;
}

export function AttachmentDrawer({
  isOpen,
  onClose,
  attachments,
  onUploadClick,
}: AttachmentDrawerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyPath = (attachment: Attachment) => {
    const syntax = attachment.mimeType.startsWith('image/')
      ? `![${attachment.fileName}](${attachment.logicalPath})`
      : `[${attachment.fileName}](${attachment.logicalPath})`;
    navigator.clipboard.writeText(syntax);
    setCopiedId(attachment.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="border-t border-stack-metal bg-stack-surface-raised font-mono text-xs animate-fade-in">
      <div className="flex items-center justify-between px-4 py-2 border-b border-stack-metal/60 bg-stack-surface">
        <div className="flex items-center gap-2 text-stack-bone">
          <Paperclip className="w-3.5 h-3.5 text-stack-red-hover" />
          <span className="font-bold">NOTE ATTACHMENTS</span>
          <span className="text-[11px] text-stack-steel">
            ({attachments.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onUploadClick}
            className="text-[11px] text-stack-silver hover:text-stack-bone underline decoration-stack-metal"
          >
            + Add File
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-stack-steel hover:text-stack-bone hover:bg-stack-metal/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-3 max-h-40 overflow-y-auto space-y-2">
        {attachments.length === 0 ? (
          <p className="text-[11px] text-stack-steel text-center py-2">
            No attachments for this document. Paste screenshot (`Ctrl+V`) or
            drag files directly into editor.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {attachments.map((att) => {
              const isImage = att.mimeType.startsWith('image/');
              return (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-2 rounded border border-stack-metal bg-stack-surface hover:border-stack-steel transition-colors group"
                >
                  <div className="flex items-center gap-2 truncate mr-2">
                    {isImage ? (
                      <ImageIcon className="w-4 h-4 text-stack-red-hover shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-stack-silver shrink-0" />
                    )}
                    <div className="truncate">
                      <p className="text-xs text-stack-bone truncate font-medium">
                        {att.fileName}
                      </p>
                      <p className="text-[10px] text-stack-steel">
                        {(att.byteSize / 1024).toFixed(1)} KB ·{' '}
                        {att.logicalPath}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => copyPath(att)}
                      title="Copy Markdown Syntax"
                      className="p-1 rounded hover:bg-stack-metal text-stack-steel hover:text-stack-bone"
                    >
                      {copiedId === att.id ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
