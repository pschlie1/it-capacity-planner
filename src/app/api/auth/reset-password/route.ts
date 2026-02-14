import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';
import { checkRateLimit, getRateLimitResponse, getClientIp } from '@/lib/api-utils';

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(`auth:reset:${ip}`, 5);
  if (!allowed) return getRateLimitResponse();

  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { resetToken: token } });
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });

    logger.info({ userId: user.id }, 'Password reset successful');
    return NextResponse.json({ message: 'Password reset successful' });
  } catch (error) {
    logger.error({ err: error }, 'Reset password error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
