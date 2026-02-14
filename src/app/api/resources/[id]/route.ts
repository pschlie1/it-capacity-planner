import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import * as resourceService from '@/lib/services/resources';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const resource = await resourceService.getResource(auth.orgId, params.id);
  return resource ? NextResponse.json(resource) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const data = await req.json();
  const resource = await resourceService.updateResource(auth.orgId, auth.user.id, params.id, data);
  return resource ? NextResponse.json(resource) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
