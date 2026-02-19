import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-[6px] font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-cw-accent text-white hover:bg-cw-accent-hi',
        ghost:   'bg-transparent border border-cw-border text-cw-red font-sans text-xs hover:bg-[rgba(239,68,68,0.08)] hover:border-cw-red',
        outline: 'bg-cw-bg-3 border border-cw-border text-cw-text-1 font-mono hover:border-cw-accent hover:text-cw-accent-hi',
      },
      size: {
        default: 'h-8 px-3 text-sm',
        icon:    'h-8 w-8 text-base',
        sm:      'h-[22px] px-[7px] text-[10px] py-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };
