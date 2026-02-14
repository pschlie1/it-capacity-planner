import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const auth = await requireAuth('ADMIN');
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { orgId: auth.orgId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where: { orgId: auth.orgId } }),
  ]);

  return NextResponse.json({ logs, total });
}
