import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  const contractor = await prisma.contractor.create({
    data: { ...data, scenarioId: params.id },
    include: { team: true },
  });
  return NextResponse.json(contractor);
}

export async function DELETE(req: Request) {
  const { contractorId } = await req.json();
  await prisma.contractor.delete({ where: { id: contractorId } });
  return NextResponse.json({ success: true });
}
