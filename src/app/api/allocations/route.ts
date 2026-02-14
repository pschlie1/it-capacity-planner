import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { runAllocationEngine, TeamData, ProjectData, ContractorData } from '@/lib/allocation-engine';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scenarioId = searchParams.get('scenarioId');

  const teams = await prisma.team.findMany();
  const projects = await prisma.project.findMany({
    include: { teamEstimates: true },
    orderBy: { priority: 'asc' },
  });

  const priorityOverrides: Record<string, number> = {};
  let contractors: ContractorData[] = [];

  if (scenarioId) {
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
      include: { priorityOverrides: true, contractors: true },
    });
    if (scenario) {
      for (const po of scenario.priorityOverrides) {
        priorityOverrides[po.projectId] = po.priority;
      }
      contractors = scenario.contractors.map(c => ({
        teamId: c.teamId,
        roleKey: c.roleKey,
        fte: c.fte,
        weeks: c.weeks,
        startWeek: c.startWeek,
      }));
    }
  }

  const teamData: TeamData[] = teams.map(t => ({
    ...t,
    uxDesignerFte: t.uxDesignerFte,
  }));

  const projectData: ProjectData[] = projects.map(p => ({
    id: p.id,
    name: p.name,
    priority: p.priority,
    status: p.status,
    startWeekOffset: p.startWeekOffset,
    teamEstimates: p.teamEstimates.map(te => ({
      teamId: te.teamId,
      design: te.design,
      development: te.development,
      testing: te.testing,
      deployment: te.deployment,
      postDeploy: te.postDeploy,
    })),
  }));

  const result = runAllocationEngine(teamData, projectData, contractors, priorityOverrides);
  return NextResponse.json(result);
}
