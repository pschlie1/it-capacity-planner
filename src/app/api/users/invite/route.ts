import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createAuditLog } from '@/lib/services/audit';
import { guardMutation } from '@/lib/mutation-guard';
import { sanitize } from '@/lib/sanitize';
import logger from '@/lib/logger';

export async function POST(req: Request) {
  const auth = await requireAuth('ADMIN');
  if (isAuthError(auth)) return auth;

  const { data, error } = await guardMutation(req);
  if (error) return error;

  const { email, name, role } = data as { email: string; name?: string; role?: string };
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const sanitizedEmail = sanitize(email);
  const sanitizedName = sanitize(name || email.split('@')[0]);
  const userRole = role || 'MEMBER';

  const existing = await prisma.user.findUnique({ where: { email: sanitizedEmail } });
  if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 });

  // Generate a random temporary password
  const tempPassword = crypto.randomBytes(8).toString('base64url');
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: {
      email: sanitizedEmail,
      name: sanitizedName,
      passwordHash,
      role: userRole,
      orgId: auth.orgId,
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  await createAuditLog({
    orgId: auth.orgId,
    userId: auth.user.id,
    action: 'CREATE',
    entity: 'User',
    entityId: user.id,
    changes: { invited: true },
  });

  logger.info({ invitedEmail: sanitizedEmail, invitedBy: auth.user.email }, 'User invited');

  return NextResponse.json({
    user,
    credentials: {
      email: sanitizedEmail,
      temporaryPassword: tempPassword,
    },
  });
}
