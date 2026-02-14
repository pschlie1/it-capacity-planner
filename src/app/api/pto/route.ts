import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const resourceId = searchParams.get('resourceId');
  const where: any = { orgId: auth.orgId };
  if (teamId) where.teamId = teamId;
  if (resourceId) where.resourceId = resourceId;
  const entries = await prisma.pTOEntry.findMany({ where, orderBy: { startWeek: 'asc' } });
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const data = await req.json();
  if (!data.teamId || !data.personName || data.startWeek == null || data.endWeek == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const entry = await prisma.pTOEntry.create({
    data: {
      teamId: data.teamId,
      resourceId: data.resourceId || null,
      role: data.role || '',
      personName: data.personName,
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      startWeek: data.startWeek,
      endWeek: data.endWeek,
      hoursPerDay: data.hoursPerDay || 8,
      hoursPerWeek: data.hoursPerWeek || 40,
      ptoType: data.ptoType || 'Vacation',
      status: data.status || 'Planned',
      reason: data.reason || data.ptoType || 'Vacation',
      notes: data.notes || '',
      orgId: auth.orgId,
    },
  });
  return NextResponse.json(entry);
}
