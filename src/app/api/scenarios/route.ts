import { getScenarios, createScenario, getContractors, getPriorityOverrides, getTeams } from '@/lib/store';
import { NextResponse } from 'next/server';

export async function GET() {
  const scenarios = getScenarios();
  const teams = getTeams();
  const result = scenarios.map(s => ({
    ...s,
    priorityOverrides: getPriorityOverrides(s.id),
    contractors: getContractors(s.id).map(c => ({ ...c, team: teams.find(t => t.id === c.teamId) })),
  }));
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const data = await req.json();
  const scenario = createScenario(data);
  return NextResponse.json({ ...scenario, priorityOverrides: [], contractors: [] });
}
