import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';

/**
 * Get or generate a CSRF token (double-submit cookie pattern).
 * The token is stored in a cookie and must be sent back via header on mutations.
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token: compare header value with cookie value.
 * Returns null if valid, or a NextResponse error if invalid.
 */
export async function validateCsrf(req: Request): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  const headerToken = req.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  return null;
}

/**
 * GET endpoint to issue a CSRF token.
 */
export async function issueCsrfToken(): Promise<NextResponse> {
  const token = generateCsrfToken();
  const response = NextResponse.json({ csrfToken: token });
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  return response;
}
