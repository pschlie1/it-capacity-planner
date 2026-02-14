import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const where: any = { orgId: auth.orgId };
  if (projectId) where.projectId = projectId;
  const actuals = await prisma.actualEntry.findMany({ where, orderBy: { week: 'asc' } });
  return NextResponse.json(actuals);
}

export async function POST(req: Request) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const data = await req.json();
  if (!data.projectId || !data.teamId || !data.phase || !data.week || data.hours == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const entry = await prisma.actualEntry.create({
    data: {
      projectId: data.projectId,
      teamId: data.teamId,
      phase: data.phase,
      week: data.week,
      hours: data.hours,
      notes: data.notes || null,
      orgId: auth.orgId,
    },
  });
  return NextResponse.json(entry);
}
