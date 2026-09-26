import type { ReactNode } from 'react';

export interface KbdProps {
  children: ReactNode;
  className?: string;
}

export function Kbd({ children, className = '' }: KbdProps) {
  return (
    <kbd
      className={`inline-flex items-center justify-center rounded border border-stack-metal/90 bg-stack-surface-raised px-1.5 py-0.5 font-mono text-[10px] text-stack-steel shadow-inner ${className}`}
    >
      {children}
    </kbd>
  );
}
