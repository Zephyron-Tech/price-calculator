import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex-1 min-w-0 h-8 bg-cw-bg-0 border border-cw-border rounded-[6px] text-cw-text-0 font-mono text-xs px-2 py-1 outline-none transition-colors focus:border-cw-accent placeholder:text-cw-text-2',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
