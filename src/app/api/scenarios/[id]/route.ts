import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import * as scenarioService from '@/lib/services/scenarios';
import { guardMutation } from '@/lib/mutation-guard';
import { validateCsrf } from '@/lib/csrf';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const scenario = await scenarioService.getScenario(auth.orgId, params.id);
  return scenario ? NextResponse.json(scenario) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const { data, error } = await guardMutation(req);
  if (error) return error;
  const scenario = await scenarioService.updateScenario(auth.orgId, auth.user.id, params.id, data!);
  return scenario ? NextResponse.json(scenario) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth('ADMIN');
  if (isAuthError(auth)) return auth;
  const csrfError = await validateCsrf(_req);
  if (csrfError) return csrfError;
  const ok = await scenarioService.deleteScenario(auth.orgId, auth.user.id, params.id);
  return ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
