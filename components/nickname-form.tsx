'use client';

import { useState } from 'react';
import { updateNickname } from '@/lib/service';

type Props = {
  userId: string;
  initialNickname: string;
};

export function NicknameForm({
  userId,
  initialNickname,
}: Props) {
  const [nickname, setNickname] =
    useState(initialNickname);

  async function submit() {
    try {
      await updateNickname(userId, nickname);
      alert('更新しました');
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="space-y-2">
      <input
        value={nickname}
        onChange={(e) =>
          setNickname(e.target.value)
        }
      />

      <button
        type="button"
        onClick={submit}
      >
        更新
      </button>
    </div>
  );
}