import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import * as teamService from '@/lib/services/teams';
import { teamCreateSchema } from '@/lib/schemas';

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const teams = await teamService.getTeams(auth.orgId);
  return NextResponse.json(teams);
}

export async function POST(req: Request) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const body = await req.json();
  const parsed = teamCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const team = await teamService.createTeam(auth.orgId, auth.user.id, parsed.data);
  return NextResponse.json(team);
}
