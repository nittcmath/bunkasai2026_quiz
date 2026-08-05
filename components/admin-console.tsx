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

type QuestionFormState = {
  boothId: string;
  title: string;
  difficulty: string;
  point: string;
  questionText: string;
  hint: string;
  imageUrl: string;
  correctAnswer: string;
  options: string;
};

export function AdminConsole() {
  const [adminPassword, setAdminPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [booths, setBooths] = useState<BoothRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [questionForm, setQuestionForm] = useState<QuestionFormState>({
    boothId: '',
    title: '',
    difficulty: '1',
    point: '1',
    questionText: '',
    hint: '',
    imageUrl: '',
    correctAnswer: '',
    options: '',
  });
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
      apiFetch<{ data: { users: UserRow[] } }>('searchUsers', { method: 'POST', body: JSON.stringify({ query: search }) }),
      apiFetch<{ data: { booths: BoothRow[] } }>('getBooths', { method: 'GET' }),
      apiFetch<{ data: { questions: QuestionRow[] } }>('getQuestions', { method: 'GET' }),
    ]);
    setUsers(userResp.data?.users ?? []);
    setBooths(boothResp.data?.booths ?? []);
    setQuestions(questionResp.data?.questions ?? []);
    setQuestionForm((current) => ({
      ...current,
      boothId: current.boothId || boothResp.data?.booths?.[0]?.boothId || '',
    }));
  }

  async function addQuestion() {
    const response = await apiFetch<{ data: { questionId: string } }>('addQuestion', {
      method: 'POST',
      body: JSON.stringify({
        boothId: questionForm.boothId,
        title: questionForm.title,
        difficulty: Number(questionForm.difficulty),
        point: Number(questionForm.point),
        questionText: questionForm.questionText,
        hint: questionForm.hint,
        imageUrl: questionForm.imageUrl,
        correctAnswer: questionForm.correctAnswer,
        options: questionForm.options
          .split(/\r?\n|,/)
          .map((option) => option.trim())
          .filter(Boolean),
      }),
    });
    toast.success(`問題を追加しました: ${response.data?.questionId ?? ''}`);
    setQuestionForm((current) => ({
      ...current,
      title: '',
      questionText: '',
      hint: '',
      imageUrl: '',
      correctAnswer: '',
      options: '',
    }));
    await loadData();
  }

  async function deleteQuestion(questionId: string) {
    if (!window.confirm(`問題 ${questionId} を削除しますか？`)) {
      return;
    }
    await apiFetch('deleteQuestion', {
      method: 'POST',
      body: JSON.stringify({ questionId }),
    });
    toast.success('問題を削除しました');
    await loadData();
  }

  async function generateToken() {
    const response = await apiFetch<{ data: { token: string } }>('generateExchangeToken', {
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
    await apiFetch('manualPointGrant', {
      method: 'POST',
      body: JSON.stringify({ userId, point: Number(delta), reason: 'admin console' }),
    });
    toast.success('ポイントを付与しました');
  }

  async function deductPoints(userId: string) {
    const delta = window.prompt('減算ポイント数') ?? '';
    if (!delta) return;
    await apiFetch('manualPointDeduct', {
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
          <CardTitle>問題管理</CardTitle>
          <CardDescription>新しい問題を追加したり、既存問題を削除できます。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <select className="h-11 rounded-2xl border border-border bg-background px-4 text-sm" value={questionForm.boothId} onChange={(event) => setQuestionForm((current) => ({ ...current, boothId: event.target.value }))}>
              <option value="">模擬店を選択</option>
              {booths.map((booth) => (
                <option key={booth.boothId} value={booth.boothId}>
                  {booth.boothName}
                </option>
              ))}
            </select>
            <input className="h-11 rounded-2xl border border-border bg-background px-4 text-sm" value={questionForm.title} onChange={(event) => setQuestionForm((current) => ({ ...current, title: event.target.value }))} placeholder="問題タイトル" />
            <input className="h-11 rounded-2xl border border-border bg-background px-4 text-sm" value={questionForm.difficulty} onChange={(event) => setQuestionForm((current) => ({ ...current, difficulty: event.target.value }))} type="number" min="1" max="5" placeholder="難易度" />
            <input className="h-11 rounded-2xl border border-border bg-background px-4 text-sm" value={questionForm.point} onChange={(event) => setQuestionForm((current) => ({ ...current, point: event.target.value }))} type="number" min="1" placeholder="ポイント" />
          </div>
          <Textarea value={questionForm.questionText} onChange={(event) => setQuestionForm((current) => ({ ...current, questionText: event.target.value }))} placeholder="問題文" />
          <Textarea value={questionForm.hint} onChange={(event) => setQuestionForm((current) => ({ ...current, hint: event.target.value }))} placeholder="ヒント" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="h-11 rounded-2xl border border-border bg-background px-4 text-sm" value={questionForm.imageUrl} onChange={(event) => setQuestionForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="画像URL" />
            <input className="h-11 rounded-2xl border border-border bg-background px-4 text-sm" value={questionForm.correctAnswer} onChange={(event) => setQuestionForm((current) => ({ ...current, correctAnswer: event.target.value }))} placeholder="正解" />
          </div>
          <Textarea value={questionForm.options} onChange={(event) => setQuestionForm((current) => ({ ...current, options: event.target.value }))} placeholder="選択肢を改行またはカンマ区切りで入力" />
          <Button onClick={addQuestion}>問題を追加</Button>
          <div className="space-y-3">
            {questions.map((question) => (
              <div key={question.questionId} className="rounded-2xl border border-border bg-muted/40 p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{question.title}</p>
                    <p className="text-xs text-muted-foreground">{question.questionId} / {question.boothId} / Lv{question.difficulty} / {question.point} pt</p>
                    <p className="mt-2 text-muted-foreground">{question.questionText}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => deleteQuestion(question.questionId)}>
                    削除
                  </Button>
                </div>
              </div>
            ))}
          </div>
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
