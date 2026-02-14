import { addContractor, removeContractor, getTeams } from '@/lib/store';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  const contractor = addContractor({ ...data, scenarioId: params.id });
  const team = getTeams().find(t => t.id === contractor.teamId);
  return NextResponse.json({ ...contractor, team });
}

export async function DELETE(req: Request) {
  const { contractorId } = await req.json();
  removeContractor(contractorId);
  return NextResponse.json({ success: true });
}
