import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  submitted: ['estimating'],
  estimating: ['estimated'],
  estimated: ['cost_review'],
  cost_review: ['approved', 'estimating'], // can send back
  approved: ['prioritized'],
  prioritized: ['in_progress'],
  in_progress: ['completed'],
};

const WorkflowSchema = z.object({
  status: z.string(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const parsed = WorkflowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: params.id, orgId: auth.orgId },
  });

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const currentStatus = project.workflowStatus;
  const newStatus = parsed.data.status;
  const allowedTransitions = WORKFLOW_TRANSITIONS[currentStatus] || [];

  if (!allowedTransitions.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowedTransitions.join(', ')}` },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = { workflowStatus: newStatus };

  if (newStatus === 'approved') {
    updateData.approvedBy = auth.user.name || auth.user.email;
    updateData.approvedAt = new Date();
  }

  if (newStatus === 'estimating') {
    updateData.submittedBy = auth.user.name || auth.user.email;
    updateData.submittedAt = new Date();
  }

  const updated = await prisma.project.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json(updated);
}
