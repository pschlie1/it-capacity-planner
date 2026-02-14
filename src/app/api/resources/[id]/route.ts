import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import * as resourceService from '@/lib/services/resources';
import { prisma } from '@/lib/db';
import { guardMutation } from '@/lib/mutation-guard';
import { validateCsrf } from '@/lib/csrf';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const resource = await resourceService.getResource(auth.orgId, params.id);
  return resource ? NextResponse.json(resource) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const { data, error } = await guardMutation(req);
  if (error) return error;
  const resource = await resourceService.updateResource(auth.orgId, auth.user.id, params.id, data!);
  return resource ? NextResponse.json(resource) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth('ADMIN');
  if (isAuthError(auth)) return auth;
  const csrfError = await validateCsrf(_req);
  if (csrfError) return csrfError;
  const existing = await prisma.resource.findFirst({ where: { id: params.id, orgId: auth.orgId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.resource.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
