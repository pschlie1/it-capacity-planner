import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { guardMutation } from '@/lib/mutation-guard';

const US_FEDERAL_2026 = [
  { name: "New Year's Day", date: '2026-01-01', week: 1 },
  { name: 'MLK Day', date: '2026-01-19', week: 3 },
  { name: "Presidents' Day", date: '2026-02-16', week: 8 },
  { name: 'Memorial Day', date: '2026-05-25', week: 22 },
  { name: 'Juneteenth', date: '2026-06-19', week: 25 },
  { name: 'Independence Day', date: '2026-07-03', week: 27 },
  { name: 'Labor Day', date: '2026-09-07', week: 36 },
  { name: 'Columbus Day', date: '2026-10-12', week: 41 },
  { name: 'Veterans Day', date: '2026-11-11', week: 45 },
  { name: 'Thanksgiving', date: '2026-11-26', week: 48 },
  { name: 'Day After Thanksgiving', date: '2026-11-27', week: 48 },
  { name: 'Christmas Eve', date: '2026-12-24', week: 52 },
  { name: 'Christmas Day', date: '2026-12-25', week: 52 },
];

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const holidays = await prisma.holiday.findMany({ where: { orgId: auth.orgId }, orderBy: { week: 'asc' } });
  return NextResponse.json(holidays);
}

export async function POST(req: Request) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const { data, error } = await guardMutation(req);
  if (error) return error;
  const d = data as Record<string, unknown>;

  if (d.preset === 'us-federal-2026') {
    await prisma.holiday.deleteMany({ where: { orgId: auth.orgId, holidaySet: 'US Federal' } });
    await prisma.holiday.createMany({
      data: US_FEDERAL_2026.map(h => ({
        ...h, hoursOff: 8, recurring: true, holidaySet: 'US Federal', orgId: auth.orgId,
      })),
    });
    const holidays = await prisma.holiday.findMany({ where: { orgId: auth.orgId }, orderBy: { week: 'asc' } });
    return NextResponse.json(holidays);
  }

  if (!d.name || !d.date || d.week == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const holiday = await prisma.holiday.create({
    data: {
      name: d.name as string, date: d.date as string, week: d.week as number,
      hoursOff: (d.hoursOff as number) || 8, recurring: (d.recurring as boolean) ?? true,
      holidaySet: (d.holidaySet as string) || 'Custom', orgId: auth.orgId,
    },
  });
  return NextResponse.json(holiday);
}
