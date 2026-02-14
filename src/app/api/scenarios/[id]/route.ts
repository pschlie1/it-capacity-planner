import { updateScenario, deleteScenario, setPriorityOverrides, getPriorityOverrides, getContractors, getTeams } from '@/lib/store';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  if (data.priorityOverrides) setPriorityOverrides(params.id, data.priorityOverrides);
  const scenario = updateScenario(params.id, { name: data.name, locked: data.locked });
  const teams = getTeams();
  return NextResponse.json({
    ...scenario,
    priorityOverrides: getPriorityOverrides(params.id),
    contractors: getContractors(params.id).map(c => ({ ...c, team: teams.find(t => t.id === c.teamId) })),
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  deleteScenario(params.id);
  return NextResponse.json({ success: true });
}
