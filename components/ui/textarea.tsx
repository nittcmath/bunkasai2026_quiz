import * as React from 'react';
import { cn } from '@/lib/utils';

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-[120px] w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20',
        className,
      )}
      {...props}
    />
  );
}
