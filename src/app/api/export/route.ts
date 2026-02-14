import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import * as teamService from '@/lib/services/teams';
import * as projectService from '@/lib/services/projects';

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const teams = await teamService.getTeams(auth.orgId);
  const projects = await projectService.getProjects(auth.orgId);

  let csv = 'Project,Priority,Status,Team,Design Hours,Development Hours,Testing Hours,Deployment Hours,Post-Deploy Hours,Total Hours\n';

  for (const p of projects) {
    for (const te of p.teamEstimates) {
      const team = teams.find(t => t.id === te.teamId);
      const total = te.design + te.development + te.testing + te.deployment + te.postDeploy;
      csv += `"${p.name}",${p.priority},${p.status},"${team?.name || 'Unknown'}",${te.design},${te.development},${te.testing},${te.deployment},${te.postDeploy},${total}\n`;
    }
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="capacity-plan.csv"',
    },
  });
}
