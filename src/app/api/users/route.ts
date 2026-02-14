import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '@/lib/services/audit';
import { guardMutation } from '@/lib/mutation-guard';
import { sanitize } from '@/lib/sanitize';

export async function GET() {
  const auth = await requireAuth('ADMIN');
  if (isAuthError(auth)) return auth;

  const users = await prisma.user.findMany({
    where: { orgId: auth.orgId },
    select: { id: true, email: true, name: true, role: true, lastActiveAt: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const auth = await requireAuth('ADMIN');
  if (isAuthError(auth)) return auth;

  const { data, error } = await guardMutation(req);
  if (error) return error;

  const { email, name, role, password } = data as { email: string; name?: string; role: string; password?: string };
  if (!email || !role) return NextResponse.json({ error: 'Email and role required' }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 });

  const passwordHash = await bcrypt.hash(password || 'changeme123', 12);

  const user = await prisma.user.create({
    data: { email: sanitize(email), name: sanitize(name || email.split('@')[0]), passwordHash, role, orgId: auth.orgId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  await createAuditLog({ orgId: auth.orgId, userId: auth.user.id, action: 'CREATE', entity: 'User', entityId: user.id });

  return NextResponse.json(user);
}
