import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { validateCsrf } from '@/lib/csrf';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const csrfError = await validateCsrf(_req);
  if (csrfError) return csrfError;
  const existing = await prisma.holiday.findFirst({ where: { id: params.id, orgId: auth.orgId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.holiday.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
