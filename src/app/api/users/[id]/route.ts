import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { createAuditLog } from '@/lib/services/audit';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth('ADMIN');
  if (isAuthError(auth)) return auth;

  const user = await prisma.user.findFirst({ where: { id: params.id, orgId: auth.orgId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { role, name } = await req.json();
  const updateData: any = {};
  if (role) updateData.role = role;
  if (name !== undefined) updateData.name = name;

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: { id: true, email: true, name: true, role: true },
  });

  await createAuditLog({ orgId: auth.orgId, userId: auth.user.id, action: 'UPDATE', entity: 'User', entityId: params.id, changes: { role } });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth('OWNER');
  if (isAuthError(auth)) return auth;

  if (params.id === auth.user.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
  }

  const user = await prisma.user.findFirst({ where: { id: params.id, orgId: auth.orgId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.user.delete({ where: { id: params.id } });
  await createAuditLog({ orgId: auth.orgId, userId: auth.user.id, action: 'DELETE', entity: 'User', entityId: params.id });

  return NextResponse.json({ success: true });
}
