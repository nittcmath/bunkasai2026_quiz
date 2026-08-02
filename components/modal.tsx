'use client';

import { ReactNode } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  onClose: () => void;
};

export function Modal({ open, title, description, children, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <div className="p-5 sm:p-6">
          <h2 className="text-xl font-bold">{title}</h2>
          {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
          <div className="mt-5">{children}</div>
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              閉じる
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
