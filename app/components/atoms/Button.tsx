import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'outline'
  | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-stack-red-slate text-stack-bone hover:bg-stack-red-hover border border-stack-red-muted shadow-sm',
  secondary:
    'bg-stack-surface-raised text-stack-silver hover:text-stack-bone hover:bg-stack-metal border border-stack-metal/70',
  ghost:
    'bg-transparent text-stack-silver hover:text-stack-bone hover:bg-stack-surface-raised border border-transparent',
  outline:
    'bg-transparent text-stack-bone hover:bg-stack-surface-raised border border-stack-metal',
  danger:
    'bg-stack-red-muted/40 text-stack-red-hover hover:bg-stack-red-muted/70 border border-stack-red-slate/40',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-xs gap-1.5',
  md: 'px-3.5 py-1.5 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2.5',
  icon: 'h-8 w-8 p-1.5 justify-center',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-mono font-medium rounded transition-all duration-150 select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
