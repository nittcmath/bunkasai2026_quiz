import * as React from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-11 w-full rounded-2xl border border-border bg-background px-4 py-2 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20',
        className,
      )}
      {...props}
    />
  );
}
