import fs from 'node:fs/promises';
import path from 'node:path';
import { initialDb } from './mock-data';
import {
  Answer,
  ApiResponse,
  Booth,
  BoothVisit,
  DbState,
  Exchange,
  ExchangeToken,
  RankingRow,
  QuestionView,
  User,
  UserHistory,
} from './types';
import { normalizeText, nowIso, safeNumber, uniqueStrings, uuid } from './utils';

const dataDir = path.join(process.cwd(), '.data');
const dbPath = path.join(dataDir, 'db.json');

let writeQueue: Promise<unknown> = Promise.resolve();

async function ensureDbFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dbPath);
  } catch {
    await fs.writeFile(dbPath, JSON.stringify(initialDb, null, 2), 'utf8');
  }
}

export async function loadDb(): Promise<DbState> {
  await ensureDbFile();
  const raw = await fs.readFile(dbPath, 'utf8');
  try {
    const parsed = JSON.parse(raw) as DbState;
    return {
      ...initialDb,
      ...parsed,
      booths: parsed.booths ?? initialDb.booths,
      questions: parsed.questions ?? initialDb.questions,
      users: parsed.users ?? [],
      answers: parsed.answers ?? [],
      questionViews: parsed.questionViews ?? [],
      boothVisits: parsed.boothVisits ?? [],
      exchangeTokens: parsed.exchangeTokens ?? [],
      exchanges: parsed.exchanges ?? [],
      adminLogs: parsed.adminLogs ?? [],
      analytics: parsed.analytics ?? [],
    };
  } catch {
    await fs.writeFile(dbPath, JSON.stringify(initialDb, null, 2), 'utf8');
    return structuredClone(initialDb);
  }
}

export async function saveDb(db: DbState) {
  await ensureDbFile();
  writeQueue = writeQueue.then(() => fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf8'));
  await writeQueue;
}

export async function withDb<T>(task: (db: DbState) => Promise<T> | T): Promise<T> {
  const db = await loadDb();
  const result = await task(db);
  await saveDb(db);
  return result;
}

export function getBoothById(db: DbState, boothId: string) {
  return db.booths.find((booth) => booth.boothId === boothId) ?? null;
}

export function getQuestionById(db: DbState, questionId: string) {
  return db.questions.find((question) => question.questionId === questionId) ?? null;
}

export function getUserById(db: DbState, userId: string) {
  return db.users.find((user) => user.userId === userId) ?? null;
}

export function getUserByNickname(db: DbState, nickname: string) {
  const normalized = normalizeText(nickname);
  return db.users.find((user) => normalizeText(user.nickname) === normalized) ?? null;
}

export function ensureUser(db: DbState, userId: string, nickname?: string, ip?: string) {
  let user = getUserById(db, userId);
  if (!user) {
    user = {
      userId,
      nickname: nickname?.trim() || '',
      createdAt: nowIso(),
      lastLogin: nowIso(),
      totalPoints: 0,
      currentPoints: 0,
      correctCount: 0,
      answerCount: 0,
      visitedBooths: [],
      lastActivity: nowIso(),
      lastIp: ip,
    };
    db.users.push(user);
  }
  if (nickname && !user.nickname) {
    user.nickname = nickname.trim();
  }
  user.lastLogin = nowIso();
  user.lastActivity = nowIso();
  if (ip) {
    user.lastIp = ip;
  }
  return user;
}

export function buildRanking(db: DbState): RankingRow[] {
  return [...db.users]
    .sort((left, right) => {
      if (right.totalPoints !== left.totalPoints) return right.totalPoints - left.totalPoints;
      if (right.correctCount !== left.correctCount) return right.correctCount - left.correctCount;
      return new Date(right.lastActivity).getTime() - new Date(left.lastActivity).getTime();
    })
    .map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      nickname: user.nickname || '名無し',
      totalPoints: user.totalPoints,
      currentPoints: user.currentPoints,
      correctCount: user.correctCount,
      answerCount: user.answerCount,
      visitedBooths: user.visitedBooths.length,
      lastActivity: user.lastActivity,
    }));
}

export function buildUserHistory(db: DbState, userId: string): UserHistory {
  return {
    answers: db.answers.filter((answer) => answer.userId === userId).sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    exchanges: db.exchanges.filter((exchange) => exchange.userId === userId).sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    boothVisits: db.boothVisits.filter((visit) => visit.userId === userId).sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
  };
}

export function buildQuestionViewHistory(db: DbState, userId: string) {
  return db.questionViews.filter((view) => view.userId === userId).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function computeSolvedQuestionIds(db: DbState, userId: string) {
  return new Set(db.answers.filter((answer) => answer.userId === userId && answer.isCorrect).map((answer) => answer.questionId));
}

export function computeAnsweredQuestionIds(db: DbState, userId: string) {
  return new Set(db.answers.filter((answer) => answer.userId === userId).map((answer) => answer.questionId));
}

export function safePointDelta(point: number) {
  return safeNumber(point, 0);
}

export function toResponse<T>(success: boolean, message: string, data: T | null): ApiResponse<T> {
  return { success, message, data };
}

export function getBoothsGrouped(db: DbState, boothId: string) {
  return db.questions
    .filter((question) => question.boothId === boothId)
    .sort((left, right) => left.difficulty - right.difficulty || left.title.localeCompare(right.title));
}

export function markBoothVisit(db: DbState, userId: string, boothId: string) {
  const user = getUserById(db, userId);
  if (!user) return null;
  user.visitedBooths = uniqueStrings([...user.visitedBooths, boothId]);
  user.lastActivity = nowIso();
  const visit: BoothVisit = {
    visitId: uuid(),
    userId,
    boothId,
    timestamp: nowIso(),
  };
  db.boothVisits.push(visit);
  return visit;
}

export function recordQuestionView(db: DbState, userId: string, questionId: string, boothId: string) {
  const view: QuestionView = {
    viewId: uuid(),
    userId,
    questionId,
    boothId,
    timestamp: nowIso(),
  };
  db.questionViews.push(view);
  const user = getUserById(db, userId);
  if (user) {
    user.lastActivity = nowIso();
  }
  return view;
}

export function addAdminLog(db: DbState, action: string, detail: string) {
  db.adminLogs.push({
    logId: uuid(),
    adminAction: action,
    detail,
    timestamp: nowIso(),
  });
}

export function issueExchangeToken(db: DbState, prizeName: string, cost: number) {
  const token: ExchangeToken = {
    token: uuid(),
    prizeName,
    cost,
    createdAt: nowIso(),
    expireAt: new Date(Date.now() + 60_000).toISOString(),
    used: false,
    usedBy: null,
  };
  db.exchangeTokens.push(token);
  return token;
}

export function getValidExchangeToken(db: DbState, tokenValue: string) {
  const token = db.exchangeTokens.find((item) => item.token === tokenValue) ?? null;
  if (!token) return { token: null, reason: 'token not found' };
  if (token.used) return { token, reason: 'token already used' };
  if (new Date(token.expireAt).getTime() < Date.now()) return { token, reason: 'token expired' };
  return { token, reason: null };
}

export function rebuildCurrentPoints(db: DbState) {
  for (const user of db.users) {
    const earned = db.answers.filter((answer) => answer.userId === user.userId && answer.isCorrect).reduce((sum, answer) => sum + answer.earnedPoint, 0);
    const spent = db.exchanges.filter((exchange) => exchange.userId === user.userId).reduce((sum, exchange) => sum + exchange.cost, 0);
    user.totalPoints = earned;
    user.currentPoints = Math.max(0, earned - spent);
  }
}
