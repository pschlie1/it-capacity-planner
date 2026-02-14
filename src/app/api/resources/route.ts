import { NextResponse } from 'next/server';
import { getResources, createResource, getAssignments, getResourceWeeklyUtilization } from '@/lib/resource-store';
import { getStore } from '@/lib/store';

export async function GET() {
  const resources = getResources();
  const teams = getStore().teams;
  const projects = getStore().projects;
  const assignments = getAssignments();

  const enriched = resources.map(r => {
    const team = teams.find(t => t.id === r.teamId);
    const resourceAssignments = assignments.filter(a => a.resourceId === r.id).map(a => {
      const project = projects.find(p => p.id === a.projectId);
      return { ...a, projectName: project?.name || 'Unknown' };
    });
    const utilization = getResourceWeeklyUtilization(r.id);
    const avgUtilization = utilization.reduce((a, b) => a + b, 0) / 52;
    const maxUtilization = Math.max(...utilization);
    const currentWeekUtil = utilization[0] || 0;

    return {
      ...r,
      teamName: team?.name || 'Unknown',
      assignments: resourceAssignments,
      utilization,
      avgUtilization,
      maxUtilization,
      currentWeekUtil,
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(req: Request) {
  const data = await req.json();
  const resource = createResource(data);
  return NextResponse.json(resource, { status: 201 });
}
