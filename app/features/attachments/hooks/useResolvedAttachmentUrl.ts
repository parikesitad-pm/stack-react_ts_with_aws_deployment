import { useState, useEffect } from 'react';
import { attachmentResolver } from '../services/attachmentResolver.service';

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
  path?: string,
  noteId?: string,
  sub?: string
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
      .acquire(path, noteId, sub)
      .then((resolvedUrl) => {
        if (isMounted) {
          setUrl(resolvedUrl);
          setStatus('resolved');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setStatus('missing');
          setError(
            err instanceof Error
              ? err.message
              : "This attachment isn't available on this device."
          );
        }
      });

    return () => {
      isMounted = false;
      attachmentResolver.release(path, noteId, sub);
    };
  }, [path, noteId, sub]);

  return { status, url, error };
}
