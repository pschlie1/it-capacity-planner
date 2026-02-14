import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import * as scenarioService from '@/lib/services/scenarios';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const data = await req.json();
  const contractor = await scenarioService.addContractor(auth.orgId, auth.user.id, params.id, data);
  return contractor ? NextResponse.json(contractor) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const { contractorId } = await req.json();
  const ok = await scenarioService.removeContractor(auth.orgId, auth.user.id, params.id, contractorId);
  return ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
