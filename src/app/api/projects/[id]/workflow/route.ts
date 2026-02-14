import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/db';

const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  submitted: ['estimating'],
  estimating: ['estimated', 'submitted'],
  estimated: ['cost_review', 'estimating'],
  cost_review: ['approved', 'estimating'],
  approved: ['prioritized', 'cost_review'],
  prioritized: ['in_progress', 'approved'],
  in_progress: ['completed', 'on_hold'],
  on_hold: ['in_progress', 'prioritized'],
  completed: [],
};

const WORKFLOW_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  estimating: 'Estimating',
  estimated: 'Estimated',
  cost_review: 'Cost Review',
  approved: 'Approved',
  prioritized: 'Prioritized',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
};

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const project = await prisma.project.findFirst({
    where: { id: params.id, orgId: auth.orgId },
    select: { id: true, workflowStatus: true },
  });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const currentStatus = project.workflowStatus ?? 'submitted';
  const allowedTransitions = WORKFLOW_TRANSITIONS[currentStatus] ?? [];

  return NextResponse.json({
    currentStatus,
    currentLabel: WORKFLOW_LABELS[currentStatus] ?? currentStatus,
    allowedTransitions: allowedTransitions.map((s) => ({
      status: s,
      label: WORKFLOW_LABELS[s] ?? s,
    })),
    allStatuses: Object.entries(WORKFLOW_LABELS).map(([status, label]) => ({ status, label })),
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;

  const project = await prisma.project.findFirst({
    where: { id: params.id, orgId: auth.orgId },
  });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { status: newStatus } = await req.json();
  if (!newStatus || typeof newStatus !== 'string') {
    return NextResponse.json({ error: 'status field required' }, { status: 400 });
  }

  const currentStatus = project.workflowStatus ?? 'submitted';
  const allowed = WORKFLOW_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowed.join(', ')}` },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = { workflowStatus: newStatus };

  if (newStatus === 'approved') {
    updateData.approvedBy = auth.user.name ?? auth.user.email;
    updateData.approvedAt = new Date();
  }

  await prisma.project.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({
    success: true,
    previousStatus: currentStatus,
    newStatus,
    label: WORKFLOW_LABELS[newStatus],
  });
}
