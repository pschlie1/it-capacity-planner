import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import * as teamService from '@/lib/services/teams';
import { guardMutation } from '@/lib/mutation-guard';
import { validateCsrf } from '@/lib/csrf';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const team = await teamService.getTeam(auth.orgId, params.id);
  return team ? NextResponse.json(team) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const { data, error } = await guardMutation(req);
  if (error) return error;
  const team = await teamService.updateTeam(auth.orgId, auth.user.id, params.id, data!);
  return team ? NextResponse.json(team) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth('ADMIN');
  if (isAuthError(auth)) return auth;
  const csrfError = await validateCsrf(_req);
  if (csrfError) return csrfError;
  const ok = await teamService.deleteTeam(auth.orgId, auth.user.id, params.id);
  return ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
