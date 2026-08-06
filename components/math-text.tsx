'use client';

import { useMemo } from 'react';
import katex from 'katex';

export function MathText({
  value,
}: {
  value: string;
}) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(value, {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      return value;
    }
  }, [value]);

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: html,
      }}
    />
  );
}