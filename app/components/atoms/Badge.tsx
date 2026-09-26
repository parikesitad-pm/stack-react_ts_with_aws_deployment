import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant = 'default' | 'active' | 'muted' | 'accent';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-stack-surface-raised text-stack-steel border-stack-metal/70',
  active: 'bg-stack-metal/60 text-stack-bone border-stack-steel/50',
  muted: 'bg-stack-bg text-stack-steel/70 border-stack-metal/40',
  accent:
    'bg-stack-red-muted/30 text-stack-red-hover border-stack-red-slate/40',
};

export function Badge({
  variant = 'default',
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
