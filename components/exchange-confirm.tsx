'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Button } from './ui/button';
import { toast } from 'sonner';

type Props = {
  visitorId: string;
  token: string;
  currentPoints: number;
  prizeName: string;
  cost: number;
};

export function ExchangeConfirm({ visitorId, token, currentPoints, prizeName, cost }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function redeem() {
    setLoading(true);
    try {
      const response = await apiFetch<{ success: boolean; message: string; data: { currentPoints: number } | null }>('redeemExchangeToken', {
        method: 'POST',
        body: JSON.stringify({ userId: visitorId, token }),
      });
      setResult(response.message);
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '交換に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5 rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div>
        <p className="text-sm text-muted-foreground">景品名</p>
        <p className="text-lg font-bold">{prizeName}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-muted p-3">
          <p className="text-muted-foreground">必要ポイント</p>
          <p className="text-lg font-bold">{cost} pt</p>
        </div>
        <div className="rounded-2xl bg-muted p-3">
          <p className="text-muted-foreground">現在ポイント</p>
          <p className="text-lg font-bold">{currentPoints} pt</p>
        </div>
      </div>
      <Button className="w-full" size="lg" onClick={redeem} disabled={loading}>
        {loading ? '交換中...' : '交換を確定'}
      </Button>
      {result ? <p className="text-sm font-medium text-accent">{result}</p> : null}
    </div>
  );
}
