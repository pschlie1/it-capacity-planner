import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { priority: 'asc' },
    include: { teamEstimates: { include: { team: true } } },
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const { teamEstimates, ...data } = await req.json();
  const project = await prisma.project.create({
    data: {
      ...data,
      teamEstimates: teamEstimates ? { create: teamEstimates } : undefined,
    },
    include: { teamEstimates: true },
  });
  return NextResponse.json(project);
}
