import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const scenarios = await prisma.scenario.findMany({
    orderBy: { createdAt: 'desc' },
    include: { priorityOverrides: true, contractors: { include: { team: true } } },
  });
  return NextResponse.json(scenarios);
}

export async function POST(req: Request) {
  const data = await req.json();
  const scenario = await prisma.scenario.create({
    data: {
      name: data.name,
      locked: data.locked || false,
    },
    include: { priorityOverrides: true, contractors: true },
  });
  return NextResponse.json(scenario);
}
