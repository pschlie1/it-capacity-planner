import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import * as scenarioService from '@/lib/services/scenarios';
import { guardMutation } from '@/lib/mutation-guard';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const { data, error } = await guardMutation(req);
  if (error) return error;
  const contractor = await scenarioService.addContractor(auth.orgId, auth.user.id, params.id, data!);
  return contractor ? NextResponse.json(contractor) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const { data, error } = await guardMutation(req);
  if (error) return error;
  const { contractorId } = data as { contractorId: string };
  const ok = await scenarioService.removeContractor(auth.orgId, auth.user.id, params.id, contractorId);
  return ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
