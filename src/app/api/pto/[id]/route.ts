import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const existing = await prisma.pTOEntry.findFirst({ where: { id: params.id, orgId: auth.orgId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const data = await req.json();
  const updated = await prisma.pTOEntry.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const existing = await prisma.pTOEntry.findFirst({ where: { id: params.id, orgId: auth.orgId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.pTOEntry.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
