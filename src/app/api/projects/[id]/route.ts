import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { teamEstimates: { include: { team: true } } },
  });
  return project ? NextResponse.json(project) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { teamEstimates, ...data } = await req.json();
  
  if (teamEstimates) {
    await prisma.teamEstimate.deleteMany({ where: { projectId: params.id } });
    for (const te of teamEstimates) {
      await prisma.teamEstimate.create({
        data: { ...te, projectId: params.id },
      });
    }
  }
  
  const project = await prisma.project.update({
    where: { id: params.id },
    data,
    include: { teamEstimates: { include: { team: true } } },
  });
  return NextResponse.json(project);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
