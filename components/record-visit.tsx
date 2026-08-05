'use client';

import { useEffect } from 'react';
import { recordVisit } from '@/lib/service';

type Props = {
  userId: string;
  boothId: string;
};

export function RecordVisit({ userId, boothId }: Props) {
  useEffect(() => {
    if (!userId) return;

    recordVisit(userId, boothId).catch(console.error);
  }, [userId, boothId]);

  return null;
}