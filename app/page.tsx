import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  registerUser,
  getUser,
  getRanking,
  getHistory,
  getBooths,
  getQuestions,
} from '@/lib/service';
``
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPoints, formatRelative, formatDateTime } from '@/lib/format';
import { Separator } from '@/components/ui/separator';
import type { Route } from "next";

export default async function HomePage() {
  const cookieStore = await cookies();
  const visitorId = cookieStore.get('visitorId')?.value ?? '';
  const nicknameCookie = cookieStore.get('nickname')?.value ?? '';
  if (visitorId) {
    await registerUser(visitorId);
  }
  const boothsResponse = await getBooths();
  const questionsResponse = await getQuestions();

  const booths = boothsResponse.data?.booths ?? [];
  const questions = questionsResponse.data?.questions ?? [];
  const userResponse = visitorId ? await getUser(visitorId) : null;
  const rankingResponse = await getRanking();
  const historyResponse = visitorId ? await getHistory(visitorId) : null;
  const user = userResponse?.data?.user;
  const stats = userResponse?.data?.stats;
  const ranking = rankingResponse.data?.top100 ?? [];
  const history = historyResponse?.data?.history;
  const userNickname = user?.nickname || nicknameCookie;
  const recentActivity = [
    ...(history?.answers ?? []).map((answer) => ({
      type: answer.isCorrect ? '正解' : '回答',
      title: answer.questionId,
      time: answer.timestamp,
    })),

    ...(history?.boothVisits ?? []).map((visit) => ({
      type: '訪問',
      title: visit.boothId,
      time: visit.timestamp,
    })),
  ]
    .sort((left, right) =>
      right.time.localeCompare(left.time),
    )
    .slice(0, 6);
  const answeredQuestionCount = stats?.answeredQuestionCount ?? 0;
  const solvedCount = stats?.solvedCount ?? 0;
  const unreadCount = Math.max(0, questions.length - answeredQuestionCount);
  console.log(user?.visitedBooths);
  console.log(typeof user?.visitedBooths);
  console.log(Array.isArray(user?.visitedBooths));
  const visitedBoothIds =
  user?.visitedBooths?.split('|').filter(Boolean) ?? [];
  const visitedBooths = booths.filter((booth) =>
    visitedBoothIds.includes(String(booth.boothId))
  );
  const canShowQuestionLinks = visitedBooths.length > 0;

  return (
    <div className="space-y-8 animate-fadeUp">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-amber-50 via-orange-50 to-cyan-50 shadow-soft dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <CardHeader className="space-y-4">
            <Badge className="w-fit bg-primary text-primary-foreground">文化祭ポイントラリー</Badge>
            <CardTitle className="text-3xl leading-tight sm:text-4xl">QR を巡って、答えて、景品に交換する。</CardTitle>
            <CardDescription className="max-w-2xl text-base text-foreground/80">
              模擬店ごとの問題に挑戦し、ポイントを貯め、受付で景品と交換します。モバイルファーストで、現地運用に必要な履歴・ランキング・不正対策をまとめて備えています。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/ranking">ランキングを見る</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/scan">QRスキャン</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/me">マイページ</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>あなたの状態</CardTitle>
            <CardDescription>{userNickname ? `${userNickname} さん` : '初回アクセスの来場者'}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Stat label="所有ポイント" value={formatPoints(user?.currentPoints ?? 0)} />
            <Stat label="総獲得ポイント" value={formatPoints(user?.totalPoints ?? 0)} />
            <Stat label="ランキング順位" value={stats?.rank ? `${stats.rank} 位` : '-'} />
            <Stat label="解答済問題数" value={`${answeredQuestionCount} 問`} />
            <Stat label="正答数" value={`${solvedCount} 問`} />
            <Stat label="未回答問題数" value={`${unreadCount} 問`} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>主要メニュー</CardTitle>
            <CardDescription>よく使う導線をまとめています。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <MenuLink href="/ranking" label="ランキング" description="トップ100 と自分の位置を確認" />
            <MenuLink href="/me" label="マイページ" description="履歴・交換履歴・訪問履歴" />
            <MenuLink href="/scan" label="QR スキャン" description="受付や問題 QR を読み取る" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>最近の活動履歴</CardTitle>
            <CardDescription>閲覧・訪問・回答の最新イベント。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length ? recentActivity.map((item) => <HistoryItem key={`${item.type}-${item.title}-${item.time}`} type={item.type} title={item.title} time={item.time} />) : <p className="text-sm text-muted-foreground">まだ活動履歴がありません。</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>人気模擬店</CardTitle>
            <CardDescription>訪問数の多い順です。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {booths.map((booth) => (
              <div
                key={booth.boothId}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 p-3"
              >
                <div>
                  <p className="font-semibold">
                    {booth.boothName}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {booth.location}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>ランキング上位</CardTitle>
            <CardDescription>トップ 10 を表示しています。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {ranking.slice(0, 10).map((row) => (
              <div key={row.userId} className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 p-3 text-sm">
                <div className="font-semibold">
                  {row.rank} 位 {row.nickname}
                </div>
                <div>{formatPoints(row.totalPoints)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>回答スタート</CardTitle>
            <CardDescription>各模擬店の QR を一度通過すると問題を表示します。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {canShowQuestionLinks ? (
              <>
                <Separator />
                {visitedBooths.map((booth) => (
                  <Link
                    key={booth.boothId}
                    href={`/booth/${booth.boothId}`}
                    className="flex items-center justify-between rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:bg-muted">
                    <div>
                      <p className="font-semibold">{booth.boothName}</p>
                      <p className="text-xs text-muted-foreground">
                        {booth.description}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      問題を見る
                    </span>
                  </Link>
                ))}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                模擬店 QR をすべて一度ずつ通過すると、ここに問題一覧が表示されます。
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function MenuLink({ href, label, description }: { href: Route; label: string; description: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:bg-muted">
      <p className="font-semibold">{label}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}

function HistoryItem({ type, title, time }: { type: string; title: string; time: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{type}</p>
        <p className="text-xs text-muted-foreground">{formatRelative(time)}</p>
      </div>
      <p className="text-muted-foreground">{title}</p>
    </div>
  );
}
