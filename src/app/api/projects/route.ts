import { getProjects, getTeamEstimates, getTeams, createProject, setTeamEstimates } from '@/lib/store';
import { NextResponse } from 'next/server';

export async function GET() {
  const projects = getProjects();
  const teams = getTeams();
  const allEstimates = getTeamEstimates();
  
  const result = projects.map(p => ({
    ...p,
    teamEstimates: allEstimates.filter(te => te.projectId === p.id).map(te => ({
      ...te,
      team: teams.find(t => t.id === te.teamId),
    })),
  }));
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const { teamEstimates, ...data } = await req.json();
  const project = createProject(data);
  if (teamEstimates) {
    setTeamEstimates(project.id, teamEstimates);
  }
  return NextResponse.json(project);
}
