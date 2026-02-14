import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { guardMutation } from '@/lib/mutation-guard';

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const resourceId = searchParams.get('resourceId');
  const where: Record<string, string> = { orgId: auth.orgId };
  if (teamId) where.teamId = teamId;
  if (resourceId) where.resourceId = resourceId;
  const entries = await prisma.pTOEntry.findMany({ where, orderBy: { startWeek: 'asc' } });
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const { data, error } = await guardMutation(req);
  if (error) return error;
  const d = data as Record<string, unknown>;
  if (!d.teamId || !d.personName || d.startWeek == null || d.endWeek == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const entry = await prisma.pTOEntry.create({
    data: {
      teamId: d.teamId as string,
      resourceId: (d.resourceId as string) || null,
      role: (d.role as string) || '',
      personName: d.personName as string,
      startDate: (d.startDate as string) || '',
      endDate: (d.endDate as string) || '',
      startWeek: d.startWeek as number,
      endWeek: d.endWeek as number,
      hoursPerDay: (d.hoursPerDay as number) || 8,
      hoursPerWeek: (d.hoursPerWeek as number) || 40,
      ptoType: (d.ptoType as string) || 'Vacation',
      status: (d.status as string) || 'Planned',
      reason: (d.reason as string) || (d.ptoType as string) || 'Vacation',
      notes: (d.notes as string) || '',
      orgId: auth.orgId,
    },
  });
  return NextResponse.json(entry);
}
