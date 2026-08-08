import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { registerUser, getUser,  getBooth, getQuestions, getHistory } from '@/lib/service';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPoints } from '@/lib/format';
import { RecordVisit } from '@/components/record-visit';
import { Answer } from '@/lib/types';

export default async function BoothPage({ params }: { params: Promise<{ boothId: string }> }) {
  const { boothId } = await params;
  const cookieStore = await cookies();
  const visitorId = cookieStore.get('visitorId')?.value ?? '';
  if (!visitorId) {
    const registeredUser = await registerUser(visitorId);

    cookieStore.set("visitorId", registeredUser?.data?.user.userId, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
    });
  }

  const [
    questionsResponse,
    boothResponse,
    userResponse,
    history,
  ] = await Promise.all([
    getQuestions(boothId),
    getBooth(boothId),
    visitorId
    ? getUser(visitorId)
    : Promise.resolve(null),
  visitorId
    ? getHistory(visitorId)
    : Promise.resolve(null),

  ]);

  const questions = questionsResponse.data?.questions ?? [];
  const booth = boothResponse.data?.booth ?? null;
  const user = userResponse?.data?.user ?? null;

  if (!booth) {
    notFound();
  }
  const solvedQuestionIds = new Set(
    (history?.data?.history.answers ?? [])
      .filter((answer:Answer) => answer.isCorrect)
      .map((answer:Answer) => answer.questionId)
  );
  const answeredQuestionIds = new Set(
    (history?.data?.history.answers ?? [])
      .map((answer:Answer) => answer.questionId)
  );
  const grouped = questions.reduce<Record<number, typeof questions>>((acc, question) => {
    acc[question.difficulty] = [...(acc[question.difficulty] ?? []), question];
    return acc;
  }, {});

  return (
    <>
      {visitorId && (
        <RecordVisit
          userId={visitorId}
          boothId={boothId}
        />
      )}
      <div className="space-y-6">
        <Card className="border-0 bg-gradient-to-r from-orange-100 via-amber-50 to-cyan-50 shadow-soft dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <CardHeader>
            <Badge className="w-fit bg-primary text-primary-foreground">模擬店ページ</Badge>
            <CardTitle className="text-3xl">{booth.boothName}</CardTitle>
            <CardDescription className="text-base">{booth.description}</CardDescription>
            <p className="text-sm text-muted-foreground">場所: {booth.location}</p>
          </CardHeader>
        </Card>
        <div className="grid gap-6 lg:grid-cols-[1fr_0.45fr]">
          <Card>
            <CardHeader>
              <CardTitle>問題一覧</CardTitle>
              <CardDescription>難易度ごとに分類しています。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3, 4, 5].map((difficulty) => (
                <section key={difficulty} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-secondary text-secondary-foreground">Lv{difficulty}</Badge>
                    <p className="text-sm text-muted-foreground">{grouped[difficulty]?.length ?? 0} 問</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(grouped[difficulty] ?? []).map((question) => (
                      <Link key={question.questionId} href={`/question/${question.questionId}`} className="rounded-3xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:bg-muted">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{question.title}</p>
                            <p className="text-xs text-muted-foreground">{question.questionText.slice(0, 48)}...</p>
                          </div>
                          <Badge>{formatPoints(question.point)}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <Badge className={answeredQuestionIds.has(question.questionId) ? 'bg-muted' : 'bg-primary text-primary-foreground'}>{answeredQuestionIds.has(question.questionId) ? '解答済' : '未回答'}</Badge>
                          <Badge className={solvedQuestionIds.has(question.questionId) ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}>{solvedQuestionIds.has(question.questionId) ? '正解済' : '未正解'}</Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>あなたの記録</CardTitle>
              <CardDescription>{user?.nickname || '未登録'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Stat label="所有ポイント" value={formatPoints(user?.currentPoints ?? 0)} />
              <Stat label="訪問済み模擬店数" value={`${user?.visitedBooths.length ?? 0} 店`} />
              <Stat label="解答済問題数" value={`${answeredQuestionIds.size} 問`} />
              <Stat label="正答数" value={`${solvedQuestionIds.size} 問`} />
              <Button variant="outline" className="w-full" asChild>
                <Link href="/">ホームへ戻る</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
