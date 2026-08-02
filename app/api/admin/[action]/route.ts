import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, assertCsrf, signAdminToken, verifyAdminToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { addAdminLog, loadDb, toResponse, withDb } from '@/lib/store';
import { generateExchangeToken, manualPointDeduct, manualPointGrant, recalculateRanking } from '@/lib/service';
import { clamp, normalizeText } from '@/lib/utils';

function json<T>(payload: T, init?: ResponseInit) {
  return NextResponse.json(payload, init);
}

function adminGuard(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value ?? '';
  return verifyAdminToken(token);
}

function limited(request: NextRequest, action: string) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0';
  return rateLimit(`admin:${action}:${ip}`, 20, 60_000);
}

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  const guard = limited(request, action);
  if (!guard.allowed) {
    return json(toResponse(false, 'レートリミットに達しました', null), { status: 429 });
  }
  if (action !== 'login' && !adminGuard(request)) {
    return json(toResponse(false, '管理者権限が必要です', null), { status: 401 });
  }
  if (action !== 'login' && !assertCsrf(request)) {
    return json(toResponse(false, 'CSRF 検証に失敗しました', null), { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  if (action === 'login') {
    if (typeof body.password !== 'string' || body.password !== process.env.ADMIN_PASSWORD) {
      return json(toResponse(false, '管理者パスワードが一致しません', null), { status: 401 });
    }
    const token = signAdminToken();
    const response = json(toResponse(true, 'ログインしました', { token }));
    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12,
    });
    return response;
  }

  if (action === 'searchUsers') {
    const db = await loadDb();
    const query = normalizeText(typeof body.query === 'string' ? body.query : '');
    const users = db.users.filter((user) => normalizeText(user.userId).includes(query) || normalizeText(user.nickname).includes(query));
    return json(toResponse(true, 'ユーザー検索完了', { users }));
  }

  if (action === 'addQuestion') {
    return json(
      await withDb(async (db) => {
        const boothId = typeof body.boothId === 'string' ? body.boothId : '';
        const booth = db.booths.find((item) => item.boothId === boothId);
        if (!booth) return toResponse(false, '模擬店が見つかりません', null);
        const questionId = `q-${String(db.questions.length + 1).padStart(3, '0')}`;
        db.questions.push({
          questionId,
          boothId,
          title: String(body.title ?? '').slice(0, 80),
          difficulty: clamp(Number(body.difficulty ?? 1), 1, 5) as 1 | 2 | 3 | 4 | 5,
          point: clamp(Number(body.point ?? 1), 1, 99),
          questionText: String(body.questionText ?? '').slice(0, 1000),
          hint: String(body.hint ?? '').slice(0, 500),
          imageUrl: String(body.imageUrl ?? '').slice(0, 500),
          correctAnswer: String(body.correctAnswer ?? '').slice(0, 200),
          options: Array.isArray(body.options) ? body.options.map(String).slice(0, 8) : [],
          createdAt: new Date().toISOString(),
        });
        addAdminLog(db, 'addQuestion', questionId);
        return toResponse(true, '問題を追加しました', { questionId });
      }),
    );
  }

  if (action === 'editQuestion') {
    return json(
      await withDb(async (db) => {
        const question = db.questions.find((item) => item.questionId === body.questionId);
        if (!question) return toResponse(false, '問題が見つかりません', null);
        question.title = String(body.title ?? question.title).slice(0, 80);
        question.difficulty = clamp(Number(body.difficulty ?? question.difficulty), 1, 5) as 1 | 2 | 3 | 4 | 5;
        question.point = clamp(Number(body.point ?? question.point), 1, 99);
        question.questionText = String(body.questionText ?? question.questionText).slice(0, 1000);
        question.hint = String(body.hint ?? question.hint).slice(0, 500);
        question.imageUrl = String(body.imageUrl ?? question.imageUrl).slice(0, 500);
        question.correctAnswer = String(body.correctAnswer ?? question.correctAnswer).slice(0, 200);
        question.options = Array.isArray(body.options) ? body.options.map(String).slice(0, 8) : question.options;
        addAdminLog(db, 'editQuestion', question.questionId);
        return toResponse(true, '問題を更新しました', { questionId: question.questionId });
      }),
    );
  }

  if (action === 'deleteQuestion') {
    return json(
      await withDb(async (db) => {
        const before = db.questions.length;
        db.questions = db.questions.filter((item) => item.questionId !== body.questionId);
        if (db.questions.length === before) return toResponse(false, '問題が見つかりません', null);
        addAdminLog(db, 'deleteQuestion', String(body.questionId ?? ''));
        return toResponse(true, '問題を削除しました', { deleted: true });
      }),
    );
  }

  if (action === 'addBooth') {
    return json(
      await withDb(async (db) => {
        const boothId = `b-${String(db.booths.length + 1).padStart(2, '0')}`;
        db.booths.push({
          boothId,
          boothName: String(body.boothName ?? '').slice(0, 80),
          description: String(body.description ?? '').slice(0, 300),
          location: String(body.location ?? '').slice(0, 80),
        });
        addAdminLog(db, 'addBooth', boothId);
        return toResponse(true, '模擬店を追加しました', { boothId });
      }),
    );
  }

  if (action === 'editBooth') {
    return json(
      await withDb(async (db) => {
        const booth = db.booths.find((item) => item.boothId === body.boothId);
        if (!booth) return toResponse(false, '模擬店が見つかりません', null);
        booth.boothName = String(body.boothName ?? booth.boothName).slice(0, 80);
        booth.description = String(body.description ?? booth.description).slice(0, 300);
        booth.location = String(body.location ?? booth.location).slice(0, 80);
        addAdminLog(db, 'editBooth', booth.boothId);
        return toResponse(true, '模擬店を更新しました', { boothId: booth.boothId });
      }),
    );
  }

  if (action === 'generateExchangeToken') {
    return json(await generateExchangeToken(String(body.prizeName ?? ''), Number(body.cost ?? 0)));
  }

  if (action === 'manualPointGrant') {
    return json(await manualPointGrant(String(body.userId ?? ''), Number(body.point ?? 0), String(body.reason ?? 'admin')));
  }

  if (action === 'manualPointDeduct') {
    return json(await manualPointDeduct(String(body.userId ?? ''), Number(body.point ?? 0), String(body.reason ?? 'admin')));
  }

  if (action === 'recalculateRanking') {
    return json(await recalculateRanking());
  }

  if (action === 'exportCsv') {
    const db = await loadDb();
    const users = ['userId,nickname,createdAt,lastLogin,totalPoints,currentPoints,correctCount,answerCount,visitedBooths,lastActivity', ...db.users.map((user) => [user.userId, user.nickname, user.createdAt, user.lastLogin, user.totalPoints, user.currentPoints, user.correctCount, user.answerCount, user.visitedBooths.join('|'), user.lastActivity].join(','))].join('\n');
    const answers = ['answerId,userId,questionId,userAnswer,isCorrect,earnedPoint,timestamp', ...db.answers.map((answer) => [answer.answerId, answer.userId, answer.questionId, answer.userAnswer, answer.isCorrect, answer.earnedPoint, answer.timestamp].join(','))].join('\n');
    const exchanges = ['exchangeId,userId,nickname,prizeName,cost,timestamp', ...db.exchanges.map((exchange) => [exchange.exchangeId, exchange.userId, exchange.nickname, exchange.prizeName, exchange.cost, exchange.timestamp].join(','))].join('\n');
    return json(toResponse(true, 'CSV を出力しました', { users, answers, exchanges }));
  }

  return json(toResponse(false, `Unsupported admin action: ${action}`, null), { status: 404 });
}
