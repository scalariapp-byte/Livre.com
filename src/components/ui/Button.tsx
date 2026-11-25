import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'soft';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  block?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink shadow-glow hover:brightness-[1.06] active:brightness-95',
  secondary: 'bg-ink text-bg hover:opacity-90',
  soft: 'bg-accent/10 text-accent hover:bg-accent/15',
  outline: 'border border-line bg-surface text-ink hover:bg-surface-2',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  danger: 'bg-danger text-white hover:brightness-110',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-xl',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, iconRight, loading, block, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition duration-150 ease-spring active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
      {iconRight}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'soft' | 'outline' | 'primary';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', variant = 'ghost', className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full transition duration-150 ease-spring active:scale-90 disabled:opacity-40',
        size === 'sm' && 'size-8',
        size === 'md' && 'size-10',
        size === 'lg' && 'size-12',
        variant === 'ghost' && 'text-ink-2 hover:bg-surface-2 hover:text-ink',
        variant === 'soft' && 'bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink',
        variant === 'outline' && 'border border-line bg-surface text-ink-2 hover:text-ink',
        variant === 'primary' && 'bg-accent text-accent-ink shadow-glow hover:brightness-110',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
