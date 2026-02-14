import { getProject, updateProject, deleteProject, setTeamEstimates, getTeamEstimates, getTeams } from '@/lib/store';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const project = getProject(params.id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const teams = getTeams();
  const estimates = getTeamEstimates(params.id).map(te => ({ ...te, team: teams.find(t => t.id === te.teamId) }));
  return NextResponse.json({ ...project, teamEstimates: estimates });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { teamEstimates, ...data } = await req.json();
  if (teamEstimates) setTeamEstimates(params.id, teamEstimates);
  const project = updateProject(params.id, data);
  return NextResponse.json(project);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  deleteProject(params.id);
  return NextResponse.json({ success: true });
}
