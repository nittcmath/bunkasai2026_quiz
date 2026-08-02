import { loadDb, withDb, ensureUser, getBoothById, getQuestionById, getUserById, getUserByNickname, buildRanking, buildUserHistory, markBoothVisit, issueExchangeToken, getValidExchangeToken, addAdminLog, rebuildCurrentPoints, safePointDelta, toResponse, computeAnsweredQuestionIds, computeSolvedQuestionIds, recordQuestionView, buildQuestionViewHistory } from './store';
import { ApiResponse, Booth, Exchange, Question, RankingRow, User, UserHistory } from './types';
import { normalizeText, nowIso, uuid, clamp } from './utils';

export type RequestContext = {
  userId: string;
  nickname?: string;
  ip?: string;
};

export async function registerUser(userId: string, nickname?: string, ip?: string): Promise<ApiResponse<{ user: User } | null>> {
  return withDb(async (db) => {
    const user = ensureUser(db, userId, nickname, ip);
    user.lastLogin = nowIso();
    addAdminLog(db, 'registerUser', `${user.userId} nickname=${user.nickname || 'empty'}`);
    return toResponse(true, 'ユーザーを登録しました', { user });
  });
}

export async function getUser(userId: string): Promise<ApiResponse<{ user: User | null; stats: Record<string, number> } | null>> {
  const db = await loadDb();
  const user = getUserById(db, userId);
  if (!user) {
    return toResponse(true, 'ユーザーが見つかりません', { user: null, stats: { answerCount: 0, solvedCount: 0, visitedBooths: 0, openedQuestionCount: 0, rank: 0 } });
  }
  const ranking = buildRanking(db);
  const rank = ranking.find((row) => row.userId === user.userId)?.rank ?? 0;
  return toResponse(true, 'ユーザー情報を取得しました', {
    user,
    stats: {
      answerCount: user.answerCount,
      solvedCount: computeSolvedQuestionIds(db, user.userId).size,
      answeredQuestionCount: computeAnsweredQuestionIds(db, user.userId).size,
      visitedBooths: user.visitedBooths.length,
      openedQuestionCount: buildQuestionViewHistory(db, user.userId).length,
      rank,
    },
  });
}

export async function updateNickname(userId: string, nickname: string): Promise<ApiResponse<{ user: User } | null>> {
  return withDb(async (db) => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      return toResponse(false, 'ニックネームが空です', null);
    }
    const conflict = getUserByNickname(db, trimmed);
    if (conflict && conflict.userId !== userId) {
      return toResponse(false, 'そのニックネームは使用済みです', null);
    }
    const user = ensureUser(db, userId);
    user.nickname = trimmed.slice(0, 24);
    user.lastActivity = nowIso();
    addAdminLog(db, 'updateNickname', `${user.userId} -> ${user.nickname}`);
    return toResponse(true, 'ニックネームを更新しました', { user });
  });
}

export async function recordVisit(userId: string, boothId: string): Promise<ApiResponse<{ boothVisitId: string } | null>> {
  return withDb(async (db) => {
    const user = ensureUser(db, userId);
    const booth = getBoothById(db, boothId);
    if (!booth) {
      return toResponse(false, '模擬店が見つかりません', null);
    }
    const visit = markBoothVisit(db, user.userId, boothId);
    if (!visit) {
      return toResponse(false, '来場記録を保存できませんでした', null);
    }
    addAdminLog(db, 'recordVisit', `${user.userId} visited ${boothId}`);
    return toResponse(true, '来場記録を保存しました', { boothVisitId: visit.visitId });
  });
}

export async function recordQuestionOpen(userId: string, questionId: string): Promise<ApiResponse<{ viewId: string } | null>> {
  return withDb(async (db) => {
    const user = ensureUser(db, userId);
    const question = getQuestionById(db, questionId);
    if (!question) {
      return toResponse(false, '問題が見つかりません', null);
    }
    const view = recordQuestionView(db, user.userId, question.questionId, question.boothId);
    addAdminLog(db, 'recordQuestionOpen', `${user.userId} viewed ${question.questionId}`);
    return toResponse(true, '問題の閲覧を記録しました', { viewId: view.viewId });
  });
}

export async function getBooths(): Promise<ApiResponse<{ booths: Booth[] }>> {
  const db = await loadDb();
  return toResponse(true, '模擬店一覧を取得しました', { booths: db.booths });
}

export async function getQuestions(boothId?: string): Promise<ApiResponse<{ questions: Question[] }>> {
  const db = await loadDb();
  const questions = boothId ? db.questions.filter((question) => question.boothId === boothId) : db.questions;
  return toResponse(true, '問題一覧を取得しました', {
    questions: [...questions].sort((left, right) => left.difficulty - right.difficulty || left.title.localeCompare(right.title)),
  });
}

export async function getQuestion(questionId: string): Promise<ApiResponse<{ question: Question | null }>> {
  const db = await loadDb();
  return toResponse(true, '問題を取得しました', { question: getQuestionById(db, questionId) });
}

export async function submitAnswer(params: { userId: string; questionId: string; answer: string; nickname?: string; ip?: string }): Promise<ApiResponse<{ answerId: string; isCorrect: boolean; earnedPoint: number; solved: boolean } | null>> {
  return withDb(async (db) => {
    const user = ensureUser(db, params.userId, params.nickname, params.ip);
    const question = getQuestionById(db, params.questionId);
    if (!question) {
      return toResponse(false, '問題が見つかりません', null);
    }
    const normalizedAnswer = normalizeText(params.answer);
    const normalizedCorrect = normalizeText(question.correctAnswer);
    const isCorrect = normalizedAnswer === normalizedCorrect;
    const alreadySolved = db.answers.some((answer) => answer.userId === user.userId && answer.questionId === question.questionId && answer.isCorrect);
    const earnedPoint = isCorrect && !alreadySolved ? question.point : 0;
    const answerId = uuid();
    db.answers.push({
      answerId,
      userId: user.userId,
      questionId: question.questionId,
      userAnswer: params.answer.trim().slice(0, 120),
      isCorrect,
      earnedPoint,
      timestamp: nowIso(),
    });
    user.answerCount += 1;
    if (earnedPoint > 0) {
      user.totalPoints += earnedPoint;
      user.currentPoints += earnedPoint;
      if (isCorrect && !alreadySolved) {
        user.correctCount += 1;
      }
    }
    user.lastActivity = nowIso();
    if (params.ip) {
      user.lastIp = params.ip;
    }
    addAdminLog(db, 'submitAnswer', `${user.userId} ${question.questionId} correct=${isCorrect} earned=${earnedPoint}`);
    return toResponse(true, isCorrect ? '正解です' : '回答を受け付けました', {
      answerId,
      isCorrect,
      earnedPoint,
      solved: alreadySolved || isCorrect,
    });
  });
}

export async function getRanking(): Promise<ApiResponse<{ ranking: RankingRow[]; top100: RankingRow[] }>> {
  const db = await loadDb();
  const ranking = buildRanking(db);
  return toResponse(true, 'ランキングを取得しました', { ranking, top100: ranking.slice(0, 100) });
}

export async function getHistory(userId: string): Promise<ApiResponse<{ history: UserHistory }>> {
  const db = await loadDb();
  return toResponse(true, '履歴を取得しました', { history: buildUserHistory(db, userId) });
}

export async function generateExchangeToken(prizeName: string, cost: number): Promise<ApiResponse<{ token: string; expireAt: string } | null>> {
  return withDb(async (db) => {
    const safeCost = clamp(safePointDelta(cost), 1, 9999);
    const cleanPrizeName = prizeName.trim().slice(0, 50);
    if (!cleanPrizeName) {
      return toResponse(false, '景品名が空です', null);
    }
    const token = issueExchangeToken(db, cleanPrizeName, safeCost);
    addAdminLog(db, 'generateExchangeToken', `${cleanPrizeName} cost=${safeCost}`);
    return toResponse(true, '交換用QRトークンを発行しました', { token: token.token, expireAt: token.expireAt });
  });
}

export async function redeemExchangeToken(userId: string, tokenValue: string): Promise<ApiResponse<{ exchangeId: string; currentPoints: number } | null>> {
  return withDb(async (db) => {
    const user = ensureUser(db, userId);
    const { token, reason } = getValidExchangeToken(db, tokenValue);
    if (!token || reason) {
      return toResponse(false, `交換トークンが無効です: ${reason ?? 'unknown'}`, null);
    }
    if (user.currentPoints < token.cost) {
      return toResponse(false, 'ポイントが不足しています', null);
    }
    user.currentPoints -= token.cost;
    const exchangeId = uuid();
    const exchange: Exchange = {
      exchangeId,
      userId: user.userId,
      nickname: user.nickname || '名無し',
      prizeName: token.prizeName,
      cost: token.cost,
      timestamp: nowIso(),
    };
    db.exchanges.push(exchange);
    token.used = true;
    token.usedBy = user.userId;
    user.lastActivity = nowIso();
    addAdminLog(db, 'redeemExchangeToken', `${user.userId} exchanged ${token.prizeName} cost=${token.cost}`);
    return toResponse(true, '景品交換が完了しました', { exchangeId, currentPoints: user.currentPoints });
  });
}

export async function manualPointGrant(userId: string, point: number, reason = 'manual grant'): Promise<ApiResponse<{ user: User } | null>> {
  return withDb(async (db) => {
    const user = ensureUser(db, userId);
    const delta = clamp(Math.abs(safePointDelta(point)), 1, 1000);
    user.totalPoints += delta;
    user.currentPoints += delta;
    user.lastActivity = nowIso();
    addAdminLog(db, 'manualPointGrant', `${user.userId} +${delta} ${reason}`);
    return toResponse(true, 'ポイントを付与しました', { user });
  });
}

export async function manualPointDeduct(userId: string, point: number, reason = 'manual deduct'): Promise<ApiResponse<{ user: User } | null>> {
  return withDb(async (db) => {
    const user = ensureUser(db, userId);
    const delta = clamp(Math.abs(safePointDelta(point)), 1, 1000);
    user.currentPoints = Math.max(0, user.currentPoints - delta);
    user.totalPoints = Math.max(0, user.totalPoints - delta);
    user.lastActivity = nowIso();
    addAdminLog(db, 'manualPointDeduct', `${user.userId} -${delta} ${reason}`);
    return toResponse(true, 'ポイントを減算しました', { user });
  });
}

export async function recalculateRanking(): Promise<ApiResponse<{ ranking: RankingRow[] } | null>> {
  return withDb(async (db) => {
    rebuildCurrentPoints(db);
    addAdminLog(db, 'recalculateRanking', 'ranking rebuilt from history');
    return toResponse(true, 'ランキングを再計算しました', { ranking: buildRanking(db) });
  });
}

export async function analytics(): Promise<ApiResponse<Record<string, unknown>>> {
  const db = await loadDb();
  const visitors = new Set(db.boothVisits.map((visit) => visit.userId)).size;
  const answers = db.answers.length;
  const correct = db.answers.filter((answer) => answer.isCorrect).length;
  const exchangeCount = db.exchanges.length;
  const boothCounts = db.boothVisits.reduce<Record<string, number>>((acc, visit) => {
    acc[visit.boothId] = (acc[visit.boothId] ?? 0) + 1;
    return acc;
  }, {});
  const questionCounts = db.answers.reduce<Record<string, number>>((acc, answer) => {
    acc[answer.questionId] = (acc[answer.questionId] ?? 0) + 1;
    return acc;
  }, {});
  const correctnessByQuestion = db.questions.map((question) => {
    const list = db.answers.filter((answer) => answer.questionId === question.questionId);
    const correctCount = list.filter((answer) => answer.isCorrect).length;
    return {
      questionId: question.questionId,
      answerCount: list.length,
      correctRate: list.length ? Math.round((correctCount / list.length) * 100) : 0,
    };
  });
  return toResponse(true, '分析データを取得しました', {
    visitors,
    uniqueUsers: db.users.length,
    answers,
    correctRate: answers ? Math.round((correct / answers) * 100) : 0,
    exchangeCount,
    boothRanking: Object.entries(boothCounts).sort((left, right) => right[1] - left[1]),
    questionCounts,
    correctnessByQuestion,
    totalDistributedPoints: db.answers.reduce((sum, answer) => sum + answer.earnedPoint, 0),
    totalSpentPoints: db.exchanges.reduce((sum, exchange) => sum + exchange.cost, 0),
  });
}
