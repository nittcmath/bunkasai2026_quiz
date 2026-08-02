import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { registerUser, recordQuestionOpen } from '@/lib/service';
import { loadDb } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnswerForm } from '@/components/answer-form';

export default async function QuestionPage({ params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params;
  const cookieStore = await cookies();
  const visitorId = cookieStore.get('visitorId')?.value ?? '';
  if (visitorId) {
    await registerUser(visitorId);
  }
  const db = await loadDb();
  const question = db.questions.find((item) => item.questionId === questionId);
  if (!question) {
    notFound();
  }
  if (visitorId) {
    await recordQuestionOpen(visitorId, question.questionId);
  }
  const booth = db.booths.find((item) => item.boothId === question.boothId);
  const user = visitorId ? db.users.find((item) => item.userId === visitorId) : null;
  const solved = db.answers.some((answer) => answer.userId === visitorId && answer.questionId === question.questionId && answer.isCorrect);

  return (
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
            {question.questionText}
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
          <AnswerForm visitorId={visitorId} question={question} initialNickname={user?.nickname ?? ''} />
        </CardContent>
      </Card>
    </div>
  );
}
