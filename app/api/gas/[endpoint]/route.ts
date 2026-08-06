import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, assertCsrf, getRequestIp, verifyAdminToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { toResponse } from '@/lib/store';

const GAS_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function ensureGasUrl() {
  if (!GAS_URL) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not configured');
  }
  return GAS_URL;
}

function buildGasUrl(endpoint: string, request: NextRequest) {
  const url = new URL(ensureGasUrl());
  url.searchParams.set('endpoint', endpoint);
  request.nextUrl.searchParams.forEach((value, key) => {
    if (key === 'endpoint') return;
    url.searchParams.set(key, value);
  });
  return url;
}

function adminGuard(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value ?? '';
  return verifyAdminToken(token);
}

async function proxyToGas(request: NextRequest, endpoint: string) {
  const targetUrl = buildGasUrl(endpoint, request);
  const method = request.method.toUpperCase();

  const response = await fetch(targetUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(request.headers.get('cookie') ? { cookie: request.headers.get('cookie') ?? '' } : {}),
      ...(method === 'POST' ? { 'x-csrf-token': request.headers.get('x-csrf-token') ?? '' } : {}),
    },
    body: method === 'POST' ? await request.text() : undefined,
    cache: 'no-store',
  });

  const text = await response.text();
  const headers = new Headers({ 'Content-Type': response.headers.get('content-type') ?? 'application/json; charset=utf-8' });
  return new NextResponse(text, { status: response.status, headers });
}

function json<T>(payload: T, init?: ResponseInit) {
  return NextResponse.json(payload, init);
}

function limited(request: NextRequest, endpoint: string) {
  const ip = getRequestIp(request);
  return rateLimit(`${endpoint}:${ip}`, 40, 60_000);
}

export async function GET(request: NextRequest, context: { params: Promise<{ endpoint: string }> }) {
  const { endpoint } = await context.params;
  const guard = limited(request, endpoint);
  if (!guard.allowed) {
    return json(toResponse(false, 'レートリミットに達しました', null), { status: 429 });
  }
  try {
    return await proxyToGas(request, endpoint);
  } catch (error) {
    return json(toResponse(false, String(error instanceof Error ? error.message : error), null), { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ endpoint: string }> }) {
  const { endpoint } = await context.params;
  const guard = limited(request, endpoint);
  const csrfExempt = [
    'registerUser',
    'getUser',
    'getQuestions',
    'getQuestion',
    'getBooths',
    'ranking',
    'analytics',
    'getHistory',
  ];
  const ADMIN_ENDPOINTS = [
    'addQuestion',
    'editQuestion',
    'deleteQuestion',
    'addBooth',
    'editBooth',
    'manualPointGrant',
    'manualPointDeduct',
    'generateExchangeToken',
    'recalculateRanking',
    'exportCsv',
  ];
  if (  ADMIN_ENDPOINTS.includes(endpoint) && !adminGuard(request)) {
  return json(
    toResponse(
      false,
      '管理者権限が必要です',
      null
    ),
    { status: 401 }
  );
}
  if (!guard.allowed) {
    return json(toResponse(false, 'レートリミットに達しました', null), { status: 429 });
  }
  if ( !csrfExempt.includes(endpoint) && !assertCsrf(request)) 
  {
    return json(
      toResponse(
        false,
        'CSRF 検証に失敗しました',
        null
      ),
      { status: 403 }
    );
  }
  try {
    return await proxyToGas(request, endpoint);
  } catch (error) {
    return json(toResponse(false, String(error instanceof Error ? error.message : error), null), { status: 500 });
  }
}
