import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { calculateProjectEstimate, calculateAggregateEstimate } from '@/lib/services/estimation';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const project = await prisma.project.findFirst({
    where: { id: params.id, orgId: auth.orgId },
  });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const teamEstimates = await prisma.teamEstimate.findMany({
    where: { projectId: params.id, orgId: auth.orgId },
    include: { team: { select: { id: true, name: true } } },
  });

  const org = await prisma.organization.findUnique({ where: { id: auth.orgId } });
  const blendedRate = org?.blendedRate ?? 95;

  const estimateInputs = teamEstimates.map((te) => ({
    teamId: te.team.id,
    teamName: te.team.name,
    devHours: te.devHours,
  }));

  const aggregate = calculateAggregateEstimate(estimateInputs, { blendedRate });

  return NextResponse.json({
    projectId: project.id,
    projectName: project.name,
    workflowStatus: project.workflowStatus,
    blendedRate,
    aggregate,
    teamEstimates: teamEstimates.map((te) => ({
      id: te.id,
      teamId: te.team.id,
      teamName: te.team.name,
      devHours: te.devHours,
      calculatedPhases: te.calculatedPhases,
      confidence: te.confidence,
      design: te.design,
      development: te.development,
      testing: te.testing,
      deployment: te.deployment,
      postDeploy: te.postDeploy,
    })),
  });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth('MEMBER');
  if (isAuthError(auth)) return auth;

  const project = await prisma.project.findFirst({
    where: { id: params.id, orgId: auth.orgId },
  });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { teamEstimates: inputEstimates } = body as {
    teamEstimates: Array<{ teamId: string; devHours: number; confidence?: string }>;
  };

  if (!Array.isArray(inputEstimates)) {
    return NextResponse.json({ error: 'teamEstimates array required' }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({ where: { id: auth.orgId } });
  const blendedRate = org?.blendedRate ?? 95;

  // Upsert each team estimate and calculate phases
  for (const input of inputEstimates) {
    const result = calculateProjectEstimate(input.devHours, { blendedRate });

    await prisma.teamEstimate.upsert({
      where: {
        projectId_teamId: { projectId: params.id, teamId: input.teamId },
      },
      create: {
        projectId: params.id,
        teamId: input.teamId,
        orgId: auth.orgId,
        devHours: input.devHours,
        design: result.phases.technicalDesign,
        development: result.phases.development,
        testing: result.phases.testing,
        deployment: 8,
        postDeploy: result.phases.support,
        calculatedPhases: JSON.stringify(result.phases),
        confidence: input.confidence ?? 'medium',
      },
      update: {
        devHours: input.devHours,
        design: result.phases.technicalDesign,
        development: result.phases.development,
        testing: result.phases.testing,
        deployment: 8,
        postDeploy: result.phases.support,
        calculatedPhases: JSON.stringify(result.phases),
        confidence: input.confidence ?? undefined,
      },
    });
  }

  // Recalculate aggregate and update project
  const allEstimates = await prisma.teamEstimate.findMany({
    where: { projectId: params.id, orgId: auth.orgId },
    include: { team: { select: { id: true, name: true } } },
  });

  const aggregate = calculateAggregateEstimate(
    allEstimates.map((te) => ({ teamId: te.team.id, teamName: te.team.name, devHours: te.devHours })),
    { blendedRate }
  );

  await prisma.project.update({
    where: { id: params.id },
    data: {
      estimatedCost: aggregate.totalCost,
      capexAmount: aggregate.totalCapex,
      opexAmount: aggregate.totalOpex,
      estimatedWeeks: aggregate.estimatedWeeks,
      teamSizeRecommended: aggregate.recommendedTeamSize,
      testingModel: aggregate.teams.length > 0 ? aggregate.teams[0].result.testingModel : null,
    },
  });

  return NextResponse.json({ success: true, aggregate });
}
