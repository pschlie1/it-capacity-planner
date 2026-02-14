import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { guardMutation } from '@/lib/mutation-guard';
import { validateCsrf } from '@/lib/csrf';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const existing = await prisma.pTOEntry.findFirst({ where: { id: params.id, orgId: auth.orgId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { data, error } = await guardMutation(req);
  if (error) return error;
  const updated = await prisma.pTOEntry.update({ where: { id: params.id }, data: data! });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const csrfError = await validateCsrf(_req);
  if (csrfError) return csrfError;
  const existing = await prisma.pTOEntry.findFirst({ where: { id: params.id, orgId: auth.orgId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.pTOEntry.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
