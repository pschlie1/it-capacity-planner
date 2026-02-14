import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const team = await prisma.team.findUnique({ where: { id: params.id }, include: { teamEstimates: true, contractors: true } });
  return team ? NextResponse.json(team) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  const team = await prisma.team.update({ where: { id: params.id }, data });
  return NextResponse.json(team);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.team.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
