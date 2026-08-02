'use client';

import { useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { QRCodeBlock } from './qr-code';
import { toast } from 'sonner';

type UserRow = {
  userId: string;
  nickname: string;
  totalPoints: number;
  currentPoints: number;
  correctCount: number;
  answerCount: number;
};

type QuestionRow = {
  questionId: string;
  boothId: string;
  title: string;
  difficulty: number;
  point: number;
  questionText: string;
  hint: string;
  imageUrl: string;
  correctAnswer: string;
  options: string[];
};

type BoothRow = {
  boothId: string;
  boothName: string;
  description: string;
  location: string;
};

export function AdminConsole() {
  const [adminPassword, setAdminPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [booths, setBooths] = useState<BoothRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [prizeName, setPrizeName] = useState('記念ステッカー');
  const [cost, setCost] = useState('3');
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [generatedUrl, setGeneratedUrl] = useState<string>('');

  const stats = useMemo(() => ({ users: users.length, booths: booths.length, questions: questions.length }), [users.length, booths.length, questions.length]);

  async function login() {
    try {
      await apiFetch('admin/login', {
        method: 'POST',
        body: JSON.stringify({ password: adminPassword }),
      });
      setLoggedIn(true);
      toast.success('管理者としてログインしました');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ログインに失敗しました');
    }
  }

  async function loadData() {
    const [userResp, boothResp, questionResp] = await Promise.all([
      apiFetch<{ data: { users: UserRow[] } }>('admin/searchUsers', { method: 'POST', body: JSON.stringify({ query: search }) }),
      apiFetch<{ data: { booths: BoothRow[] } }>('getBooths', { method: 'GET' }),
      apiFetch<{ data: { questions: QuestionRow[] } }>('getQuestions', { method: 'GET' }),
    ]);
    setUsers(userResp.data?.users ?? []);
    setBooths(boothResp.data?.booths ?? []);
    setQuestions(questionResp.data?.questions ?? []);
  }

  async function generateToken() {
    const response = await apiFetch<{ data: { token: string } }>('admin/generateExchangeToken', {
      method: 'POST',
      body: JSON.stringify({ prizeName, cost: Number(cost) }),
    });
    const token = response.data?.token ?? '';
    setGeneratedToken(token);
    setGeneratedUrl(`${window.location.origin}/exchange?token=${token}`);
    toast.success('交換QRを生成しました');
  }

  async function grantPoints(userId: string) {
    const delta = window.prompt('付与ポイント数') ?? '';
    if (!delta) return;
    await apiFetch('admin/manualPointGrant', {
      method: 'POST',
      body: JSON.stringify({ userId, point: Number(delta), reason: 'admin console' }),
    });
    toast.success('ポイントを付与しました');
  }

  async function deductPoints(userId: string) {
    const delta = window.prompt('減算ポイント数') ?? '';
    if (!delta) return;
    await apiFetch('admin/manualPointDeduct', {
      method: 'POST',
      body: JSON.stringify({ userId, point: Number(delta), reason: 'admin console' }),
    });
    toast.success('ポイントを減算しました');
  }

  if (!loggedIn) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>管理者ログイン</CardTitle>
          <CardDescription>環境変数の管理者パスワードでログインします。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder="管理者パスワード" />
          <Button className="w-full" onClick={login}>
            ログイン
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>管理ダッシュボード</CardTitle>
          <CardDescription>ユーザー・模擬店・景品交換QR を一括管理します。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Badge className="justify-center bg-secondary text-secondary-foreground">ユーザー {stats.users}</Badge>
          <Badge className="justify-center bg-primary text-primary-foreground">模擬店 {stats.booths}</Badge>
          <Badge className="justify-center bg-accent text-accent-foreground">問題 {stats.questions}</Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>検索</CardTitle>
          <CardDescription>visitorId / ニックネームを横断検索します。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="検索キーワード" />
          <Button onClick={loadData}>ユーザー検索</Button>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.userId} className="rounded-2xl border border-border bg-muted/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{user.nickname || '名無し'}</p>
                    <p className="text-xs text-muted-foreground">{user.userId}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => grantPoints(user.userId)}>
                      ポイント付与
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deductPoints(user.userId)}>
                      ポイント減算
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>交換QR発行</CardTitle>
          <CardDescription>60秒で失効する景品交換用QRを作成します。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={prizeName} onChange={(event) => setPrizeName(event.target.value)} placeholder="景品名" />
            <Input value={cost} onChange={(event) => setCost(event.target.value)} type="number" min="1" placeholder="必要ポイント" />
          </div>
          <Button onClick={generateToken}>交換QRを生成</Button>
          {generatedToken ? (
            <div className="space-y-3">
              <QRCodeBlock value={generatedUrl} />
              <p className="break-all text-sm text-muted-foreground">{generatedUrl}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>CSV / データ参照</CardTitle>
          <CardDescription>現地で必要な時にデータを閲覧できます。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {booths.map((booth) => (
              <div key={booth.boothId} className="rounded-2xl border border-border p-4 text-sm">
                <p className="font-semibold">{booth.boothName}</p>
                <p className="text-muted-foreground">{booth.location}</p>
              </div>
            ))}
          </div>
          <Separator />
          <Textarea value={JSON.stringify(questions.slice(0, 3), null, 2)} readOnly className="font-mono text-xs" />
        </CardContent>
      </Card>
    </div>
  );
}
