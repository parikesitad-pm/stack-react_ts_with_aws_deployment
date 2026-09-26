import { useResolvedAttachmentUrl } from '../hooks/useResolvedAttachmentUrl';
import { MissingAttachment } from './MissingAttachment';

export interface MarkdownImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
}

export function MarkdownImage({
  src,
  alt = '',
  className = '',
  ...props
}: MarkdownImageProps) {
  const { status, url } = useResolvedAttachmentUrl(src);

  if (status === 'resolving') {
    return (
      <span className="my-2 block h-40 w-full animate-pulse rounded bg-stack-metal/40 border border-stack-metal/60" />
    );
  }

  if (status === 'missing' || status === 'error' || !url) {
    return <MissingAttachment path={src} alt={alt} />;
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`my-3 max-h-[550px] w-auto max-w-full rounded border border-stack-metal/60 object-contain shadow-md ${className}`}
      {...props}
    />
  );
}
