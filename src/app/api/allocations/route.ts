import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import * as teamService from '@/lib/services/teams';
import * as projectService from '@/lib/services/projects';
import * as scenarioService from '@/lib/services/scenarios';
import { runAllocationEngine, TeamData, ProjectData, ContractorData } from '@/lib/allocation-engine';

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const scenarioId = searchParams.get('scenarioId');

  const teams = await teamService.getTeams(auth.orgId);
  const projects = await projectService.getProjects(auth.orgId);

  const priorityOverrides: Record<string, number> = {};
  let contractors: ContractorData[] = [];

  if (scenarioId) {
    const scenario = await scenarioService.getScenario(auth.orgId, scenarioId);
    if (scenario) {
      for (const po of scenario.priorityOverrides) {
        priorityOverrides[po.projectId] = po.priority;
      }
      contractors = scenario.contractors.map(c => ({
        teamId: c.teamId, roleKey: c.roleKey, fte: c.fte, weeks: c.weeks, startWeek: c.startWeek,
      }));
    }
  }

  const teamData: TeamData[] = teams.map(t => ({ ...t }));
  const projectData: ProjectData[] = projects.map(p => ({
    id: p.id, name: p.name, priority: p.priority, status: p.status, startWeekOffset: p.startWeekOffset,
    teamEstimates: p.teamEstimates.map((te: any) => ({
      teamId: te.teamId, design: te.design, development: te.development,
      testing: te.testing, deployment: te.deployment, postDeploy: te.postDeploy,
    })),
  }));

  const result = runAllocationEngine(teamData, projectData, contractors, priorityOverrides);
  return NextResponse.json(result);
}
