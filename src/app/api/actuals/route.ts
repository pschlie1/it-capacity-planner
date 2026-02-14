import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { guardMutation } from '@/lib/mutation-guard';

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const where: Record<string, string> = { orgId: auth.orgId };
  if (projectId) where.projectId = projectId;
  const actuals = await prisma.actualEntry.findMany({ where, orderBy: { week: 'asc' } });
  return NextResponse.json(actuals);
}

export async function POST(req: Request) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const { data, error } = await guardMutation(req);
  if (error) return error;
  const d = data as Record<string, unknown>;
  if (!d.projectId || !d.teamId || !d.phase || !d.week || d.hours == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const entry = await prisma.actualEntry.create({
    data: {
      projectId: d.projectId as string,
      teamId: d.teamId as string,
      phase: d.phase as string,
      week: d.week as number,
      hours: d.hours as number,
      notes: (d.notes as string) || null,
      orgId: auth.orgId,
    },
  });
  return NextResponse.json(entry);
}
