'use client';

import { useEffect } from 'react';
import { recordQuestionOpen } from '@/lib/service';

type Props = {
  userId: string;
  questionId: string;
};

export function RecordQuestionOpen({
  userId,
  questionId,
}: Props) {
  useEffect(() => {
    if (!userId) return;

    recordQuestionOpen(
      userId,
      questionId,
    ).catch(console.error);
  }, [userId, questionId]);

  return null;
}