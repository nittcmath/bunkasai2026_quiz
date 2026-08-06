import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import {
  registerUser,
  getUser,
  getExchangeToken,
} from '@/lib/service';
import { ExchangeConfirm } from '@/components/exchange-confirm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function ExchangePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = '' } = await searchParams;
  const cookieStore = await cookies();
  const visitorId = cookieStore.get('visitorId')?.value ?? '';
  if (visitorId) {
    await registerUser(visitorId);
  }
  const exchangeTokenResponse =
  await getExchangeToken(token);

  const exchangeToken =
    exchangeTokenResponse.data?.exchangeToken;

  if (!exchangeToken) {
    notFound();
  }

  const userResponse =
    visitorId
      ? await getUser(visitorId)
      : null;

  const user =
    userResponse?.data?.user ?? null;
  const expired = new Date(exchangeToken.expireAt).getTime() < Date.now();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <Badge className="w-fit bg-primary text-primary-foreground">景品交換</Badge>
          <CardTitle className="text-3xl">交換確認</CardTitle>
          <CardDescription>トークンの有効期限と所持ポイントを確認します。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {expired ? <Badge className="bg-destructive text-destructive-foreground">この QR は期限切れです</Badge> : null}
          {exchangeToken.used ? <Badge className="bg-muted text-muted-foreground">この QR は使用済みです</Badge> : null}
          <ExchangeConfirm visitorId={visitorId} token={token} currentPoints={user?.currentPoints ?? 0} prizeName={exchangeToken.prizeName} cost={exchangeToken.cost} />
        </CardContent>
      </Card>
    </div>
  );
}
