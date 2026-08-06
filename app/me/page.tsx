import { cookies } from 'next/headers';
import {
  registerUser,
  getUser,
  getHistory,
  getRanking,
} from '@/lib/service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, formatPoints, formatRelative } from '@/lib/format';

export default async function MePage() {
  const cookieStore = await cookies();
  const visitorId = cookieStore.get('visitorId')?.value ?? '';
  if (visitorId) {
    await registerUser(visitorId);
  }
  const [userResponse, historyResponse, rankingResponse] =
  await Promise.all([
    visitorId ? getUser(visitorId) : Promise.resolve(null),
    visitorId ? getHistory(visitorId) : Promise.resolve(null),
    getRanking(),
  ]);
  const user = userResponse?.data?.user;
  const stats = userResponse?.data?.stats;
  const history = historyResponse?.data?.history;
  const ranking = rankingResponse.data?.top100 ?? [];
  const questionViews =
    history?.questionViews ?? [];
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Badge className="w-fit bg-primary text-primary-foreground">マイページ</Badge>
          <CardTitle className="text-3xl">{user?.nickname || '名無し'}</CardTitle>
          <CardDescription>{visitorId || 'visitorId がありません'}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="総獲得ポイント" value={formatPoints(user?.totalPoints ?? 0)} />
          <Stat label="所有ポイント" value={formatPoints(user?.currentPoints ?? 0)} />
          <Stat label="正答数" value={`${user?.correctCount ?? 0} 問`} />
          <Stat label="解答数" value={`${user?.answerCount ?? 0} 回`} />
          <Stat label="訪問模擬店数" value={`${stats?.visitedBooths ?? 0} 店`} />
          <Stat label="ランキング" value={stats?.rank ? `${stats.rank} 位` : '-'} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>解答履歴 / 正誤履歴</CardTitle>
            <CardDescription>最近の回答を表示します。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(history?.answers ?? []).slice(0, 12).map((answer) => (
              <HistoryRow key={answer.answerId} label={answer.questionId} detail={answer.userAnswer} meta={`${answer.isCorrect ? '正解' : '不正解'} / ${answer.earnedPoint} pt / ${formatRelative(answer.timestamp)}`} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>ポイント利用履歴</CardTitle>
            <CardDescription>景品交換の履歴です。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(history?.exchanges ?? []).slice(0, 12).map((exchange) => (
              <HistoryRow key={exchange.exchangeId} label={exchange.prizeName} detail={`${exchange.cost} pt`} meta={formatDateTime(exchange.timestamp)} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>訪問模擬店履歴</CardTitle>
            <CardDescription>アクセス時の訪問記録です。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(history?.boothVisits ?? []).slice(0, 12).map((visit) => (
              <HistoryRow key={visit.visitId} label={visit.boothId} detail={visit.timestamp} meta={formatRelative(visit.timestamp)} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>開いた問題履歴</CardTitle>
            <CardDescription>問題詳細を表示した履歴です。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {questionViews.slice(0, 12).map((view) => (
              <HistoryRow key={view.viewId} label={view.questionId} detail={view.boothId} meta={formatRelative(view.timestamp)} />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>自分の順位</CardTitle>
          <CardDescription>ランキングの中での位置です。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ranking.filter((row) => row.userId === visitorId).map((row) => (
              <div key={row.userId} className="rounded-2xl border border-border bg-primary/10 p-4">
                <p className="font-bold">{row.rank} 位 / {row.nickname}</p>
                <p className="text-sm text-muted-foreground">{formatPoints(row.totalPoints)} / {row.correctCount} 正解</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
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

function HistoryRow({ label, detail, meta }: { label: string; detail: string; meta: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
      <p className="text-muted-foreground">{detail}</p>
    </div>
  );
}
