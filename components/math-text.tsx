'use client';

import { BlockMath } from 'react-katex';

export function MathText({
  value,
}: {
  value: string;
}) {
  return <BlockMath math={value} />;
}