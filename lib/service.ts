import { ApiResponse, Booth, ExchangeToken, Question, RankingRow, User, UserHistory } from './types';
import { apiFetch } from './api-client'

export type RequestContext = {
  userId: string;
  nickname?: string;
  ip?: string;
};

export async function registerUser(
  userId: string,
  nickname?: string,
  ip?: string,
): Promise<ApiResponse<{ user: User } | null>> {
  return apiFetch<ApiResponse<{ user: User} | null >>(
    'registerUser',
    {
      method: 'POST',
      body: JSON.stringify({
        userId,
        nickname,
        ip,
      }),
    },
  );
}

export async function getUser(
  userId: string,
): Promise<
  ApiResponse<{
    user: User | null;
    stats: Record<string, number>;
  } | null>
> {
  return apiFetch<
    ApiResponse<{
      user: User | null;
      stats: Record<string, number>;
    } | null>
  >('getUser', {
    method: 'POST',
    body: JSON.stringify({
      userId,
    }),
  });
}

export async function getExchangeToken(
  token: string,
): Promise<
  ApiResponse<{
    exchangeToken: {
      token: string;
      prizeName: string;
      cost: number;
      expireAt: string;
      used: boolean;
    };
  } | null>
> {
  return apiFetch<
    ApiResponse<{
      exchangeToken: {
        token: string;
        prizeName: string;
        cost: number;
        expireAt: string;
        used: boolean;
      };
    } | null>
  >('getExchangeToken', {
    method: 'GET',
    query: {
      token,
    },
  });
}

export async function updateNickname(
  userId: string,
  nickname: string,
): Promise<ApiResponse<{ user: User } | null>> {
  return apiFetch<ApiResponse<{ user: User } | null>>(
    'updateNickname',
    {
      method: 'POST',
      body: JSON.stringify({
        userId,
        nickname,
      }),
    },
  );
}

export async function recordVisit(
  userId: string,
  boothId: string,
): Promise<ApiResponse<{ boothVisitId: string } | null>> {
  return apiFetch<ApiResponse<{ boothVisitId: string } | null>>(
    'recordVisit',
    {
      method: 'POST',
      body: JSON.stringify({
        userId,
        boothId,
      }),
    },
  );
}

export async function recordQuestionOpen(
  userId: string,
  questionId: string,
): Promise<ApiResponse<{ viewId: string } | null>> {
  return apiFetch<ApiResponse<{ viewId: string } | null>>(
    'recordQuestionOpen',
    {
      method: 'POST',
      body: JSON.stringify({
        userId,
        questionId,
      }),
    },
  );
}

export async function getBooths(): Promise<
  ApiResponse<{ booths: Booth[] }>
> {
  return apiFetch<
    ApiResponse<{ booths: Booth[] }>
  >('getBooths', {
    method: 'GET',
  });
}

export async function getBooth(
  boothId: string,
): Promise<ApiResponse<{ booth: Booth | null }>> {
  return apiFetch<ApiResponse<{ booth: Booth | null }>>(
    'getBooth',
    {
      method: 'GET',
      query: {
        boothId,
      },
    },
  );
}

export async function getQuestions(
  boothId?: string,
): Promise<ApiResponse<{ questions: Question[] }>> {
  return apiFetch<ApiResponse<{ questions: Question[] }>>(
    'getQuestions',
    {
      method: 'POST',
      body: JSON.stringify({
        boothId,
      }),
    },
  );
}

export async function getQuestion(
  questionId: string,
): Promise<ApiResponse<{ question: Question | null }>> {
  return apiFetch<ApiResponse<{ question: Question | null }>>(
    'getQuestion',
    {
      method: 'POST',
      body: JSON.stringify({
        questionId,
      }),
    },
  );
}

export async function submitAnswer(params: {
  userId: string;
  questionId: string;
  answer: string;
  nickname?: string;
  ip?: string;
}): Promise<
  ApiResponse<{
    answerId: string;
    isCorrect: boolean;
    earnedPoint: number;
    solved: boolean;
  } | null>
> {
  return apiFetch<
    ApiResponse<{
      answerId: string;
      isCorrect: boolean;
      earnedPoint: number;
      solved: boolean;
    } | null>
  >('submitAnswer', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getRanking(): Promise<
  ApiResponse<{
    ranking: RankingRow[];
    top100: RankingRow[];
  }>
> {
  return apiFetch<
    ApiResponse<{
      ranking: RankingRow[];
      top100: RankingRow[];
    }>
  >('ranking', {
    method: 'GET',
  });
}

export async function getHistory(
  userId: string,
): Promise<ApiResponse<{ history: UserHistory }>> {
  return apiFetch<ApiResponse<{ history: UserHistory }>>(
    'getHistory',
    {
      method: 'POST',
      body: JSON.stringify({
        userId,
      }),
    },
  );
}

export async function generateExchangeToken(
  prizeName: string,
  cost: number,
): Promise<ApiResponse<{ token: string; expireAt: string } | null>> {
  return apiFetch<ApiResponse<{ token: string; expireAt: string } | null>>(
    'generateExchangeToken',
    {
      method: 'POST',
      body: JSON.stringify({
        prizeName,
        cost,
      }),
    },
  );
}

export async function redeemExchangeToken(
  userId: string,
  tokenValue: string,
): Promise<
  ApiResponse<{
    exchangeId: string;
    currentPoints: number;
  } | null>
> {
  return apiFetch<
    ApiResponse<{
      exchangeId: string;
      currentPoints: number;
    } | null>
  >('redeemExchangeToken', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      token: tokenValue,
    }),
  });
}

export async function manualPointGrant(
  userId: string,
  point: number,
  reason = 'manual grant',
): Promise<ApiResponse<{ user: User } | null>> {
  return apiFetch<ApiResponse<{ user: User } | null>>(
    'manualPointGrant',
    {
      method: 'POST',
      body: JSON.stringify({
        userId,
        point,
        reason,
      }),
    },
  );
}

export async function manualPointDeduct(
  userId: string,
  point: number,
  reason = 'manual deduct',
): Promise<ApiResponse<{ user: User } | null>> {
  return apiFetch<ApiResponse<{ user: User } | null>>(
    'manualPointDeduct',
    {
      method: 'POST',
      body: JSON.stringify({
        userId,
        point,
        reason,
      }),
    },
  );
}

export async function recalculateRanking(): Promise<
  ApiResponse<{ ranking: RankingRow[] } | null>
> {
  return apiFetch<
    ApiResponse<{ ranking: RankingRow[] } | null>
  >('recalculateRanking', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function analytics(): Promise<
  ApiResponse<Record<string, unknown>>
> {
  return apiFetch<ApiResponse<Record<string, unknown>>>(
    'analytics',
    {
      method: 'GET',
    },
  );
}
