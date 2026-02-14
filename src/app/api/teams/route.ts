import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const teams = await prisma.team.findMany({ orderBy: { name: 'asc' }, include: { contractors: true } });
  return NextResponse.json(teams);
}

export async function POST(req: Request) {
  const data = await req.json();
  const team = await prisma.team.create({ data });
  return NextResponse.json(team);
}
