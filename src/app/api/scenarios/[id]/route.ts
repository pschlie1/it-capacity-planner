import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  
  if (data.priorityOverrides) {
    await prisma.priorityOverride.deleteMany({ where: { scenarioId: params.id } });
    for (const po of data.priorityOverrides) {
      await prisma.priorityOverride.create({
        data: { scenarioId: params.id, projectId: po.projectId, priority: po.priority },
      });
    }
  }

  const scenario = await prisma.scenario.update({
    where: { id: params.id },
    data: { name: data.name, locked: data.locked },
    include: { priorityOverrides: true, contractors: { include: { team: true } } },
  });
  return NextResponse.json(scenario);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.scenario.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
