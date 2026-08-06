import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import {
  registerUser,
  getQuestions,
  getBooths,
  getHistory,
  getUser,
} from '@/lib/service';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnswerForm } from '@/components/answer-form';
import { RecordQuestionOpen } from '@/components/record-question-open';
import { MathText } from '@/components/math-text';

export default async function QuestionPage({ params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params;
  const cookieStore = await cookies();
  const visitorId = cookieStore.get('visitorId')?.value ?? '';
  const nicknameCookie = cookieStore.get('nickname')?.value ?? '';
  if (visitorId) {
    await registerUser(visitorId);
  }
  const questionsResponse = await getQuestions();

  const question =
    questionsResponse.data?.questions.find(
      (item) => item.questionId === questionId,
    ) ?? null;

  if (!question) {
    notFound();
  }

  const boothsResponse = await getBooths();

  const booth =
    boothsResponse.data?.booths.find(
      (item) => item.boothId === question.boothId,
    ) ?? null;

  const userResponse = visitorId
    ? await getUser(visitorId)
    : null;

  const historyResponse = visitorId
    ? await getHistory(visitorId)
    : null;

  const user =
    userResponse?.data?.user ?? null;
  const initialNickname = user?.nickname || nicknameCookie;

  const solved =
    (historyResponse?.data?.history.answers ?? []).some(
      (answer) =>
        answer.questionId === question.questionId &&
        answer.isCorrect,
    );
    console.log(question);
  return (
    <>
      {visitorId && (
        <RecordQuestionOpen
          userId={visitorId}
          questionId={question.questionId}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <Badge className="w-fit bg-primary text-primary-foreground">問題詳細</Badge>
            <CardTitle className="text-3xl">{question.title}</CardTitle>
            <CardDescription>
              {booth?.boothName ?? '模擬店'} / Lv{question.difficulty} / {question.point} pt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border bg-muted/40 p-5 text-base leading-8">
              <MathText value={question.questionText} />
            </div>
            {question.imageUrl ? <img src={question.imageUrl} alt={question.title} className="w-full rounded-3xl border border-border object-cover" /> : null}
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-semibold">ヒント</p>
              <p className="text-sm text-muted-foreground">{question.hint || 'ヒントはありません'}</p>
            </div>
            {solved ? <Badge className="bg-accent text-accent-foreground">既に正解済みです</Badge> : null}
            <div className="flex gap-3">
              <Link href={`/booth/${question.boothId}`} className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold transition hover:bg-muted">
                問題一覧へ
              </Link>
              <Link href="/" className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold transition hover:bg-muted">
                ホームへ
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>回答送信</CardTitle>
            <CardDescription>初回回答時はニックネーム登録を求めます。</CardDescription>
          </CardHeader>
          <CardContent>
            <AnswerForm visitorId={visitorId} question={question} initialNickname={initialNickname} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
