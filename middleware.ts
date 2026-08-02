import { NextRequest, NextResponse } from 'next/server';

const VISITOR_COOKIE = 'visitorId';
const CSRF_COOKIE = 'csrfToken';

function createVisitorIdentity() {
  return {
    visitorId: crypto.randomUUID(),
    csrfToken: Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) => value.toString(16).padStart(2, '0')).join(''),
  };
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const csrfToken = request.cookies.get(CSRF_COOKIE)?.value;
  if (!visitorId || !csrfToken) {
    const identity = createVisitorIdentity();
    response.cookies.set(VISITOR_COOKIE, identity.visitorId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
    response.cookies.set(CSRF_COOKIE, identity.csrfToken, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
