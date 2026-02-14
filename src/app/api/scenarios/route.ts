import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import * as scenarioService from '@/lib/services/scenarios';
import { scenarioCreateSchema } from '@/lib/schemas';
import { guardMutation } from '@/lib/mutation-guard';

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const scenarios = await scenarioService.getScenarios(auth.orgId);
  return NextResponse.json(scenarios);
}

export async function POST(req: Request) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const { data, error } = await guardMutation(req);
  if (error) return error;
  const parsed = scenarioCreateSchema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const scenario = await scenarioService.createScenario(auth.orgId, auth.user.id, parsed.data);
  return NextResponse.json(scenario);
}
