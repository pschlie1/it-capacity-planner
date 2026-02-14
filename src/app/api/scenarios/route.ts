import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import * as scenarioService from '@/lib/services/scenarios';
import { scenarioCreateSchema } from '@/lib/schemas';

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const scenarios = await scenarioService.getScenarios(auth.orgId);
  return NextResponse.json(scenarios);
}

export async function POST(req: Request) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const body = await req.json();
  const parsed = scenarioCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const scenario = await scenarioService.createScenario(auth.orgId, auth.user.id, parsed.data);
  return NextResponse.json(scenario);
}
