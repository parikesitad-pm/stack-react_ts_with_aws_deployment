import { useResolvedAttachmentUrl } from '../hooks/useResolvedAttachmentUrl';
import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileQuestion,
  Download,
  AlertCircle,
  File,
} from 'lucide-react';

export interface AttachmentLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  noteId?: string;
  children?: React.ReactNode;
}

export function AttachmentLink({
  href = '',
  noteId,
  children,
  className = '',
  ...props
}: AttachmentLinkProps) {
  const isLocal =
    href.startsWith('./assets/') ||
    href.startsWith('./attachments/') ||
    href.startsWith('assets/') ||
    href.startsWith('attachments/');

  // If normal link, render standard external/internal anchor
  if (!isLocal) {
    return (
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        className={`text-stack-bone underline decoration-stack-steel hover:decoration-stack-bone transition-colors ${className}`}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <LocalAttachmentDownloadLink
      href={href}
      noteId={noteId}
      className={className}
      {...props}
    >
      {children}
    </LocalAttachmentDownloadLink>
  );
}

function LocalAttachmentDownloadLink({
  href,
  noteId,
  children,
  className = '',
  ...props
}: AttachmentLinkProps & { href: string }) {
  const { status, url } = useResolvedAttachmentUrl(href, noteId);

  // Extract clean filename from href
  const fileName = href.split('/').pop() || 'attachment';
  const lowerName = fileName.toLowerCase();

  const renderIcon = () => {
    if (lowerName.endsWith('.pdf'))
      return <FileText className="h-3.5 w-3.5 text-red-400 shrink-0" />;
    if (
      lowerName.endsWith('.xls') ||
      lowerName.endsWith('.xlsx') ||
      lowerName.endsWith('.csv')
    ) {
      return (
        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
      );
    }
    if (
      lowerName.endsWith('.zip') ||
      lowerName.endsWith('.tar') ||
      lowerName.endsWith('.gz')
    ) {
      return <FileArchive className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
    }
    if (
      lowerName.endsWith('.doc') ||
      lowerName.endsWith('.docx') ||
      lowerName.endsWith('.txt') ||
      lowerName.endsWith('.md')
    ) {
      return <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0" />;
    }
    return <File className="h-3.5 w-3.5 text-stack-steel shrink-0" />;
  };

  if (
    status === 'missing' ||
    status === 'error' ||
    (!url && status !== 'resolving')
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-dashed border-red-500/40 bg-red-950/20 text-xs font-mono text-red-300">
        <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
        <span className="truncate">Missing attachment: {fileName}</span>
      </span>
    );
  }

  if (status === 'resolving') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-stack-metal bg-stack-metal/30 text-xs font-mono text-stack-steel animate-pulse">
        {renderIcon()}
        <span>Loading {fileName}…</span>
      </span>
    );
  }

  return (
    <a
      href={url || '#'}
      download={fileName}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 my-1 rounded border border-stack-metal/70 bg-stack-surface-raised hover:bg-stack-metal/40 text-xs font-mono text-stack-bone hover:text-white transition-colors cursor-pointer no-underline ${className}`}
      {...props}
    >
      {renderIcon()}
      <span className="underline decoration-stack-steel hover:decoration-stack-bone">
        {children || fileName}
      </span>
      <Download className="h-3 w-3 text-stack-steel ml-1" />
    </a>
  );
}
