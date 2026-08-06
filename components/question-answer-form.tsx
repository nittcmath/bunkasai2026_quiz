'use client';

import { useState } from 'react';
import { submitAnswer } from '@/lib/service';

type Props = {
  userId: string;
  questionId: string;
};

export function QuestionAnswerForm({
  userId,
  questionId,
}: Props) {
  const [answer, setAnswer] =
    useState('');

  async function handleSubmit() {
    try {
      const result =
        await submitAnswer({
          userId,
          questionId,
          answer,
        });

      alert(result.message);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="space-y-2">
      <input
        value={answer}
        onChange={(e) =>
          setAnswer(e.target.value)
        }
      />

      <button
        type="button"
        onClick={handleSubmit}
      >
        回答
      </button>
    </div>
  );
}