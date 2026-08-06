export type UUID = string;

export type Booth = {
  boothId: string;
  boothName: string;
  description: string;
  location: string;
};

export type Question = {
  questionId: string;
  boothId: string;
  title: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  point: number;
  questionText: string;
  hint: string;
  imageUrl: string;
  correctAnswer: string;
  options: string[];
  createdAt: string;
};

export type User = {
  userId: string;
  nickname: string;
  createdAt: string;
  lastLogin: string;
  totalPoints: number;
  currentPoints: number;
  correctCount: number;
  answerCount: number;
  visitedBooths: string[];
  lastActivity: string;
  lastIp?: string;
};

export type Answer = {
  answerId: string;
  userId: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  earnedPoint: number;
  timestamp: string;
};

export type QuestionView = {
  viewId: string;
  userId: string;
  questionId: string;
  boothId: string;
  timestamp: string;
};

export type BoothVisit = {
  visitId: string;
  userId: string;
  boothId: string;
  timestamp: string;
};

export type ExchangeToken = {
  token: string;
  prizeName: string;
  cost: number;
  createdAt: string;
  expireAt: string;
  used: boolean;
  usedBy: string | null;
};

export type Exchange = {
  exchangeId: string;
  userId: string;
  nickname: string;
  prizeName: string;
  cost: number;
  timestamp: string;
};

export type AdminLog = {
  logId: string;
  adminAction: string;
  detail: string;
  timestamp: string;
};

export type DailyAnalytics = {
  date: string;
  visitors: number;
  answers: number;
  correctRate: number;
  exchangeCount: number;
};

export type DbState = {
  users: User[];
  questions: Question[];
  answers: Answer[];
  questionViews: QuestionView[];
  booths: Booth[];
  boothVisits: BoothVisit[];
  exchangeTokens: ExchangeToken[];
  exchanges: Exchange[];
  adminLogs: AdminLog[];
  analytics: DailyAnalytics[];
};

export type ApiResponse<T = Record<string, unknown>> = {
  success: boolean;
  message: string;
  data: T | null;
};

export type RankingRow = {
  rank: number;
  userId: string;
  nickname: string;
  totalPoints: number;
  currentPoints: number;
  correctCount: number;
  answerCount: number;
  visitedBooths: number;
  lastActivity: string;
};

export type UserHistory = {
  answers: Answer[];
  exchanges: Exchange[];
  boothVisits: BoothVisit[];
};

