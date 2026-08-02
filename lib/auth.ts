import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto';
import { uuid } from './utils';

export const VISITOR_COOKIE = 'visitorId';
export const CSRF_COOKIE = 'csrfToken';
export const ADMIN_COOKIE = 'adminToken';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
};

export function createVisitorIdentity() {
  return {
    visitorId: uuid(),
    csrfToken: randomBytes(16).toString('hex'),
  };
}

export function getRequestIp(request: Request | NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? '0.0.0.0';
}

export function assertCsrf(request: Request | NextRequest) {
  const headerToken = request.headers.get('x-csrf-token') ?? '';
  const cookieToken = request.headers.get('cookie')?.match(/csrfToken=([^;]+)/)?.[1] ?? '';
  return Boolean(headerToken && cookieToken && headerToken === cookieToken);
}

export function adminSecretHash() {
  return process.env.ADMIN_PASSWORD ? createHmac('sha256', 'bunkasai-admin').update(process.env.ADMIN_PASSWORD).digest('hex') : '';
}

export function signAdminToken() {
  const secret = adminSecretHash();
  if (!secret) return '';
  const issuedAt = Date.now().toString();
  const signature = createHmac('sha256', secret).update(issuedAt).digest('hex');
  return `${issuedAt}.${signature}`;
}

export function verifyAdminToken(token?: string | null) {
  if (!token) return false;
  const secret = adminSecretHash();
  if (!secret) return false;
  const [issuedAt, signature] = token.split('.');
  if (!issuedAt || !signature) return false;
  const expected = createHmac('sha256', secret).update(issuedAt).digest('hex');
  const actual = Buffer.from(signature, 'hex');
  const compare = Buffer.from(expected, 'hex');
  return actual.length === compare.length && timingSafeEqual(actual, compare);
}
