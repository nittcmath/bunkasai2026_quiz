import { cookies } from 'next/headers';
import { registerUser, getRanking } from '@/lib/service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPoints } from '@/lib/format';

export default async function RankingPage() {
  const cookieStore = await cookies();
  const visitorId = cookieStore.get('visitorId')?.value ?? '';
  if (visitorId) {
    await registerUser(visitorId);
  }
  const rankingResponse = await getRanking();
  const ranking = rankingResponse.data?.top100 ?? [];
  const me = ranking.find((row) => row.userId === visitorId);

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-r from-cyan-50 via-white to-amber-50 shadow-soft dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <CardHeader>
          <Badge className="w-fit bg-secondary text-secondary-foreground">ランキング</Badge>
          <CardTitle className="text-3xl">トップ 100</CardTitle>
          <CardDescription>総獲得ポイント順に並べています。</CardDescription>
        </CardHeader>
      </Card>
      {me ? <Card><CardContent className="p-5"><Badge className="bg-primary text-primary-foreground">あなたの順位 {me.rank} 位</Badge></CardContent></Card> : null}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {ranking.map((row) => (
              <div key={row.userId} className={`grid grid-cols-[64px_1fr_120px] items-center gap-3 px-5 py-4 text-sm ${row.userId === visitorId ? 'bg-primary/10' : ''}`}>
                <div className="text-lg font-black">{row.rank}</div>
                <div>
                  <p className="font-semibold">{row.nickname}</p>
                  <p className="text-xs text-muted-foreground">{row.correctCount} 正解 / {row.answerCount} 回答</p>
                </div>
                <div className="text-right font-bold">{formatPoints(row.totalPoints)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
