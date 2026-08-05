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
  return json(toResponse(false, `Unsupported admin action: ${action}`, null), { status: 404 });
}
