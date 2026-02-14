import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import logger from '@/lib/logger';
import { checkRateLimit, getRateLimitResponse, getClientIp } from '@/lib/api-utils';
import { sanitize } from '@/lib/sanitize';

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(`auth:forgot:${ip}`, 5);
  if (!allowed) return getRateLimitResponse();

  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const sanitizedEmail = sanitize(email);
    const user = await prisma.user.findUnique({ where: { email: sanitizedEmail } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    logger.info({ email: sanitizedEmail, resetUrl }, 'Password reset requested — reset URL generated');

    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    logger.error({ err: error }, 'Forgot password error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
