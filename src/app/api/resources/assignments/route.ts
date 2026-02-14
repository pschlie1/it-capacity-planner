import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import * as resourceService from '@/lib/services/resources';

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const { searchParams } = new URL(req.url);
  const resourceId = searchParams.get('resourceId') || undefined;
  const projectId = searchParams.get('projectId') || undefined;
  const assignments = await resourceService.getAssignments(auth.orgId, { resourceId, projectId });
  return NextResponse.json(assignments);
}

export async function POST(req: Request) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const data = await req.json();
  const assignment = await resourceService.createAssignment(auth.orgId, auth.user.id, data);
  return NextResponse.json(assignment);
}

export async function DELETE(req: Request) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const { id } = await req.json();
  const ok = await resourceService.deleteAssignment(auth.orgId, auth.user.id, id);
  return ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
