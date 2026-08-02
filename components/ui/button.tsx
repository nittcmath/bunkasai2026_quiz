import * as React from 'react';
import { cn } from '@/lib/utils';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  asChild?: boolean;
};

export function Button({ className, variant = 'default', size = 'default', asChild = false, children, ...props }: Props) {
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:opacity-95',
    secondary: 'bg-secondary text-secondary-foreground hover:opacity-95',
    outline: 'border border-border bg-background hover:bg-muted',
    ghost: 'hover:bg-muted',
    destructive: 'bg-destructive text-destructive-foreground hover:opacity-95',
  }[variant];

  const sizeClasses = {
    default: 'h-11 px-4 py-2',
    sm: 'h-9 px-3 text-sm',
    lg: 'h-12 px-6 text-base',
  }[size];

  const classes = cn(
    'inline-flex items-center justify-center rounded-2xl text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
    variantClasses,
    sizeClasses,
    className,
  );

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<Record<string, unknown>>;
    return React.cloneElement(child, {
      ...props,
      className: cn(classes, (child.props as { className?: string }).className),
    } as any);
  }

  return (
    <button
      className={classes}
      type={props.type ?? 'button'}
      {...props}
    >
      {children}
    </button>
  );
}
