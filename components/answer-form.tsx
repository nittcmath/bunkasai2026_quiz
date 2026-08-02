'use client';

import { useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Modal } from './modal';
import { toast } from 'sonner';

type Question = {
  questionId: string;
  title: string;
  questionText: string;
  hint: string;
  point: number;
  difficulty: number;
  options: string[];
  boothId: string;
};

type Props = {
  visitorId: string;
  question: Question;
  initialNickname: string;
};

export function AnswerForm({ visitorId, question, initialNickname }: Props) {
  const [nickname, setNickname] = useState(initialNickname);
  const [answer, setAnswer] = useState(question.options[0] ?? '');
  const [customAnswer, setCustomAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsNickname, setNeedsNickname] = useState(!initialNickname);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  const normalizedAnswer = useMemo(() => (question.options.length ? answer : customAnswer), [answer, customAnswer, question.options.length]);

  async function submit() {
    const finalNickname = nickname.trim();
    if (!finalNickname) {
      setNeedsNickname(true);
      toast.error('ニックネームを入力してください');
      return;
    }
    if (!normalizedAnswer.trim()) {
      toast.error('回答を入力してください');
      return;
    }
    setLoading(true);
    try {
      const response = await apiFetch<{ success: boolean; message: string; data: { isCorrect: boolean; earnedPoint: number } | null }>('submitAnswer', {
        method: 'POST',
        body: JSON.stringify({
          visitorId,
          nickname: finalNickname,
          questionId: question.questionId,
          answer: normalizedAnswer,
        }),
      });
      setResultMessage(response.message);
      setResultOpen(true);
      toast.success(response.message);
      setNickname(finalNickname);
      if (response.data?.earnedPoint) {
        setAnswer(question.options[0] ?? '');
        setCustomAnswer('');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '送信に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-secondary text-secondary-foreground">Lv{question.difficulty}</Badge>
        <Badge className="bg-primary text-primary-foreground">{question.point} pt</Badge>
      </div>
      <div className="space-y-3 rounded-3xl border border-border bg-muted/50 p-4">
        <label className="block text-sm font-semibold">ニックネーム</label>
        <Input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="例: たろう" />
      </div>
      {question.options.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {question.options.map((option) => (
            <button
              key={option}
              onClick={() => setAnswer(option)}
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${answer === option ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-muted'}`}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <Textarea value={customAnswer} onChange={(event) => setCustomAnswer(event.target.value)} placeholder="自由入力で回答" />
      )}
      <Button className="w-full" size="lg" disabled={loading} onClick={submit}>
        {loading ? '送信中...' : '回答を送信'}
      </Button>
      <Modal
        open={needsNickname}
        title="ニックネーム登録"
        description="初回回答時はニックネームを登録してください。"
        onClose={() => setNeedsNickname(false)}
      >
        <div className="space-y-3">
          <Input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="ニックネーム" />
          <Button className="w-full" onClick={() => setNeedsNickname(false)}>
            登録して続ける
          </Button>
        </div>
      </Modal>
      <Modal open={resultOpen} title="回答送信完了" description={resultMessage} onClose={() => setResultOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">送信した内容はサーバーで検証されています。</p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setResultOpen(false)}>
              続ける
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
