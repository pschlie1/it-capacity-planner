import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import * as projectService from '@/lib/services/projects';
import { projectCreateSchema } from '@/lib/schemas';

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const projects = await projectService.getProjects(auth.orgId);
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;
  const body = await req.json();
  const parsed = projectCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const project = await projectService.createProject(auth.orgId, auth.user.id, body);
  return NextResponse.json(project);
}
