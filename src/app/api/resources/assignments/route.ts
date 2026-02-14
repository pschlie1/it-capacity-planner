import { NextResponse } from 'next/server';
import { getAssignments, createAssignment, deleteAssignment } from '@/lib/resource-store';
import { getStore } from '@/lib/store';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const resourceId = searchParams.get('resourceId') || undefined;
  const projectId = searchParams.get('projectId') || undefined;
  const assignments = getAssignments({ resourceId, projectId });
  const projects = getStore().projects;
  const resources = (await import('@/lib/resource-store')).getResources();

  const enriched = assignments.map(a => ({
    ...a,
    projectName: projects.find(p => p.id === a.projectId)?.name || 'Unknown',
    resourceName: resources.find(r => r.id === a.resourceId)?.name || 'Unknown',
  }));

  return NextResponse.json(enriched);
}

export async function POST(req: Request) {
  const data = await req.json();
  const assignment = createAssignment(data);
  return NextResponse.json(assignment, { status: 201 });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  deleteAssignment(id);
  return NextResponse.json({ ok: true });
}
