import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit, getRateLimitResponse, getClientIp } from '@/lib/api-utils';

const handler = NextAuth(authOptions);

// Wrap POST to add rate limiting on login attempts
async function rateLimitedPost(req: Request, ctx: { params: { nextauth: string[] } }) {
  // Only rate limit the credentials callback (login attempt)
  const { nextauth } = ctx.params;
  const path = Array.isArray(nextauth) ? nextauth.join('/') : '';
  if (path === 'callback/credentials') {
    const ip = getClientIp(req);
    const { allowed } = checkRateLimit(`auth:login:${ip}`, 5);
    if (!allowed) return getRateLimitResponse();
  }
  return (handler as Function)(req, ctx);
}

export { handler as GET, rateLimitedPost as POST };
