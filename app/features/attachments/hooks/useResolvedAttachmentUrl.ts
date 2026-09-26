import { useState, useEffect } from 'react';
import { attachmentResolver } from '../services/attachment-resolver.service';

export type AttachmentStatus =
  | 'idle'
  | 'resolving'
  | 'resolved'
  | 'missing'
  | 'error';

export interface UseResolvedAttachmentUrlResult {
  status: AttachmentStatus;
  url: string | null;
  error: string | null;
}

export function useResolvedAttachmentUrl(
  path?: string
): UseResolvedAttachmentUrlResult {
  const [status, setStatus] = useState<AttachmentStatus>(
    path ? 'resolving' : 'idle'
  );
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setStatus('idle');
      setUrl(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setStatus('resolving');
    setError(null);

    attachmentResolver
      .acquire(path)
      .then((resolvedUrl) => {
        if (isMounted) {
          setUrl(resolvedUrl);
          setStatus('resolved');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setStatus('missing');
          setError(err instanceof Error ? err.message : 'Attachment missing');
        }
      });

    return () => {
      isMounted = false;
      attachmentResolver.release(path);
    };
  }, [path]);

  return { status, url, error };
}
