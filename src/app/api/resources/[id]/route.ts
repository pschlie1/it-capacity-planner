import { NextResponse } from 'next/server';
import { getResource, updateResource, getAssignments, getResourceWeeklyUtilization, getProjectSkillRequirements } from '@/lib/resource-store';
import { getStore } from '@/lib/store';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const resource = getResource(params.id);
  if (!resource) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const teams = getStore().teams;
  const projects = getStore().projects;
  const assignments = getAssignments({ resourceId: params.id });
  const team = teams.find(t => t.id === resource.teamId);
  const utilization = getResourceWeeklyUtilization(params.id);

  const enrichedAssignments = assignments.map(a => {
    const project = projects.find(p => p.id === a.projectId);
    return { ...a, projectName: project?.name || 'Unknown', projectStatus: project?.status };
  });

  return NextResponse.json({
    ...resource,
    teamName: team?.name || 'Unknown',
    assignments: enrichedAssignments,
    utilization,
    avgUtilization: utilization.reduce((a, b) => a + b, 0) / 52,
    maxUtilization: Math.max(...utilization),
  });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  const resource = updateResource(params.id, data);
  if (!resource) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(resource);
}
