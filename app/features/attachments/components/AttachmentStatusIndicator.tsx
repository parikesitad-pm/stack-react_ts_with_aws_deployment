import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, RefreshCw } from 'lucide-react';
import {
  attachmentUploadService,
  type NetworkStatus,
} from '../services/attachmentUpload.service';

export function AttachmentStatusIndicator() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(
    attachmentUploadService.getNetworkStatus()
  );
  const [pendingCount, setPendingCount] = useState(
    attachmentUploadService.getPendingCount()
  );

  useEffect(() => {
    return attachmentUploadService.subscribe((status, pending) => {
      setNetworkStatus(status);
      setPendingCount(pending);
    });
  }, []);

  if (networkStatus === 'offline') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-stack-metal/30 border border-stack-metal/50 text-[10px] font-mono text-stack-steel">
        <WifiOff className="h-3 w-3 text-amber-500/80" />
        <span className="hidden sm:inline">Offline — working locally</span>
      </div>
    );
  }

  if (networkStatus === 'reconnecting' || pendingCount > 0) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-stack-metal/40 border border-stack-metal/60 text-[10px] font-mono text-stack-silver animate-pulse">
        <RefreshCw className="h-3 w-3 animate-spin text-stack-bone" />
        <span>
          Syncing{' '}
          {pendingCount > 0
            ? `${pendingCount} item${pendingCount > 1 ? 's' : ''}`
            : 'attachments'}
          …
        </span>
      </div>
    );
  }

  return null;
}
