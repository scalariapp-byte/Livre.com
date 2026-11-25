import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: (id: string) => ReactNode;
  optional?: boolean;
}

export function Field({ label, error, hint, className, children, optional }: FieldProps) {
  const id = useId();
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="flex items-center justify-between text-[13px] font-medium text-ink-2">
          {label}
          {optional && <span className="text-2xs font-normal text-muted">Optionnel</span>}
        </label>
      )}
      {children(id)}
      {error ? (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; leading?: ReactNode };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, invalid, leading, ...rest }, ref) {
  if (leading)
    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">{leading}</span>
        <input ref={ref} className={cn('field pl-10', invalid && 'field-error', className)} aria-invalid={invalid} {...rest} />
      </div>
    );
  return <input ref={ref} className={cn('field', invalid && 'field-error', className)} aria-invalid={invalid} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, ...rest }, ref) {
    return (
      <textarea ref={ref} className={cn('field min-h-[96px] resize-y leading-relaxed', invalid && 'field-error', className)} {...rest} />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function Select({ className, invalid, children, ...rest }, ref) {
    return (
      <div className="relative">
        <select ref={ref} className={cn('field appearance-none pr-10', invalid && 'field-error', className)} {...rest}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
    );
  },
);
