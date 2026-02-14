import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import {
  calculateAggregateEstimate,
  mergeEstimationConfig,
} from '@/lib/services/estimation';
import { z } from 'zod';
import { guardMutation } from '@/lib/mutation-guard';

const RecalcSchema = z.object({
  teamEstimates: z.array(z.object({
    teamEstimateId: z.string(),
    devHours: z.number().min(0),
  })).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const project = await prisma.project.findFirst({
    where: { id: params.id, orgId: auth.orgId },
    include: { teamEstimates: { include: { team: true } } },
  });

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const org = await prisma.organization.findUnique({ where: { id: auth.orgId } });
  if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 });

  const orgConfig = (typeof org.estimationConfig === 'object' && org.estimationConfig !== null)
    ? org.estimationConfig as Record<string, unknown>
    : {};
  const projectConfig = (typeof project.estimationConfig === 'object' && project.estimationConfig !== null)
    ? project.estimationConfig as Record<string, unknown>
    : {};

  const config = mergeEstimationConfig(orgConfig, projectConfig);
  config.blendedRate = org.blendedRate;

  const teamInputs = project.teamEstimates.map((te) => ({
    teamId: te.teamId,
    teamName: te.team.name,
    devHours: te.devHours,
  }));

  const estimation = calculateAggregateEstimate(teamInputs, config);

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      workflowStatus: project.workflowStatus,
      estimatedCost: project.estimatedCost,
      capexAmount: project.capexAmount,
      opexAmount: project.opexAmount,
      estimatedWeeks: project.estimatedWeeks,
      teamSizeRecommended: project.teamSizeRecommended,
      testingModel: project.testingModel,
    },
    estimation,
    config,
  });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;

  const { data: body, error: csrfError } = await guardMutation(req);
  if (csrfError) return csrfError;
  const parsed = RecalcSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: params.id, orgId: auth.orgId },
    include: { teamEstimates: { include: { team: true } } },
  });

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const org = await prisma.organization.findUnique({ where: { id: auth.orgId } });
  if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 });

  // Update individual team dev hours if provided
  if (parsed.data.teamEstimates) {
    for (const te of parsed.data.teamEstimates) {
      await prisma.teamEstimate.update({
        where: { id: te.teamEstimateId },
        data: { devHours: te.devHours },
      });
    }
  }

  // Re-fetch after updates
  const updated = await prisma.project.findFirst({
    where: { id: params.id, orgId: auth.orgId },
    include: { teamEstimates: { include: { team: true } } },
  });

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const orgConfig = (typeof org.estimationConfig === 'object' && org.estimationConfig !== null)
    ? org.estimationConfig as Record<string, unknown>
    : {};
  const projectConfig = (typeof updated.estimationConfig === 'object' && updated.estimationConfig !== null)
    ? updated.estimationConfig as Record<string, unknown>
    : {};

  const config = mergeEstimationConfig(orgConfig, projectConfig);
  config.blendedRate = org.blendedRate;

  const teamInputs = updated.teamEstimates.map((te) => ({
    teamId: te.teamId,
    teamName: te.team.name,
    devHours: te.devHours,
  }));

  const estimation = calculateAggregateEstimate(teamInputs, config);

  // Save calculated phases per team estimate
  for (const teamEst of estimation.teams) {
    const dbTeamEst = updated.teamEstimates.find((te) => te.teamId === teamEst.teamId);
    if (dbTeamEst) {
      await prisma.teamEstimate.update({
        where: { id: dbTeamEst.id },
        data: { calculatedPhases: JSON.parse(JSON.stringify(teamEst.estimate)) },
      });
    }
  }

  // Update project-level aggregates
  await prisma.project.update({
    where: { id: params.id },
    data: {
      estimatedCost: estimation.totals.totalCost,
      capexAmount: estimation.totals.capexAmount,
      opexAmount: estimation.totals.opexAmount,
      estimatedWeeks: estimation.totals.durationWeeks,
      teamSizeRecommended: estimation.totals.teamSize,
      testingModel: estimation.totals.testingModel,
    },
  });

  return NextResponse.json({ estimation });
}
