export type SyncState =
  | 'saved_locally'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'conflict';

export interface StatusIndicatorProps {
  status: SyncState;
  showLabel?: boolean;
  className?: string;
}

const statusConfigs: Record<
  SyncState,
  { label: string; dotClass: string; textClass: string }
> = {
  saved_locally: {
    label: 'Saved locally',
    dotClass: 'bg-stack-steel',
    textClass: 'text-stack-steel',
  },
  syncing: {
    label: 'Syncing...',
    dotClass: 'bg-stack-silver animate-pulse',
    textClass: 'text-stack-silver',
  },
  synced: {
    label: 'Synced',
    dotClass: 'bg-emerald-500/80',
    textClass: 'text-emerald-400/90',
  },
  offline: {
    label: 'Offline',
    dotClass: 'bg-amber-500/80',
    textClass: 'text-amber-400/90',
  },
  conflict: {
    label: 'Conflict detected',
    dotClass: 'bg-stack-red-slate animate-ping',
    textClass: 'text-stack-red-hover',
  },
};

export function StatusIndicator({
  status,
  showLabel = true,
  className = '',
}: StatusIndicatorProps) {
  const config = statusConfigs[status];

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${className}`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${config.dotClass}`}
      />
      {showLabel && <span className={config.textClass}>{config.label}</span>}
    </div>
  );
}
