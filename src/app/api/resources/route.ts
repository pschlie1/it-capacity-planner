import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import * as resourceService from '@/lib/services/resources';

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const resources = await resourceService.getResources(auth.orgId);
  return NextResponse.json(resources);
}

export async function POST(req: Request) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const data = await req.json();
  const resource = await resourceService.createResource(auth.orgId, auth.user.id, data);
  return NextResponse.json(resource);
}
