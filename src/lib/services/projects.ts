import { prisma } from '../db';
import { createAuditLog } from './audit';

function serializeProject(p: any) {
  return {
    ...p,
    requiredSkills: p.requiredSkills || [],
    dependencies: p.dependencies || [],
    milestones: p.milestones || [],
    actualHours: p.actualHours || {},
    teamEstimates: p.teamEstimates?.map((te: any) => ({
      ...te,
      roleBreakdown: te.roleBreakdown || {},
      team: te.team,
    })) || [],
  };
}

export async function getProjects(orgId: string) {
  const projects = await prisma.project.findMany({
    where: { orgId },
    include: { teamEstimates: { include: { team: { select: { name: true } } } } },
    orderBy: { priority: 'asc' },
  });
  return projects.map(serializeProject);
}

export async function getProject(orgId: string, id: string) {
  const project = await prisma.project.findFirst({
    where: { id, orgId },
    include: { teamEstimates: { include: { team: { select: { name: true } } } } },
  });
  if (!project) return null;
  return serializeProject(project);
}

export async function createProject(orgId: string, userId: string, data: any) {
  const { teamEstimates, requiredSkills, dependencies, milestones, actualHours, ...rest } = data;
  
  const project = await prisma.project.create({
    data: {
      ...rest,
      requiredSkills: requiredSkills || [],
      dependencies: dependencies || [],
      milestones: milestones || [],
      actualHours: actualHours || {},
      orgId,
    },
  });

  if (teamEstimates?.length) {
    await prisma.teamEstimate.createMany({
      data: teamEstimates.map((te: any) => ({
        projectId: project.id,
        teamId: te.teamId,
        design: te.design || 0,
        development: te.development || 0,
        testing: te.testing || 0,
        deployment: te.deployment || 0,
        postDeploy: te.postDeploy || 0,
        roleBreakdown: te.roleBreakdown || {},
        confidence: te.confidence,
        orgId,
      })),
    });
  }

  await createAuditLog({ orgId, userId, action: 'CREATE', entity: 'Project', entityId: project.id });
  return getProject(orgId, project.id);
}

export async function updateProject(orgId: string, userId: string, id: string, data: any) {
  const existing = await prisma.project.findFirst({ where: { id, orgId } });
  if (!existing) return null;

  const { teamEstimates, requiredSkills, dependencies, milestones, actualHours, ...rest } = data;
  const updateData: any = { ...rest };
  if (requiredSkills !== undefined) updateData.requiredSkills = requiredSkills;
  if (dependencies !== undefined) updateData.dependencies = dependencies;
  if (milestones !== undefined) updateData.milestones = milestones;
  if (actualHours !== undefined) updateData.actualHours = actualHours;

  await prisma.project.update({ where: { id }, data: updateData });

  if (teamEstimates) {
    await prisma.teamEstimate.deleteMany({ where: { projectId: id, orgId } });
    if (teamEstimates.length) {
      await prisma.teamEstimate.createMany({
        data: teamEstimates.map((te: any) => ({
          projectId: id,
          teamId: te.teamId,
          design: te.design || 0,
          development: te.development || 0,
          testing: te.testing || 0,
          deployment: te.deployment || 0,
          postDeploy: te.postDeploy || 0,
          roleBreakdown: te.roleBreakdown || {},
          confidence: te.confidence,
          orgId,
        })),
      });
    }
  }

  await createAuditLog({ orgId, userId, action: 'UPDATE', entity: 'Project', entityId: id });
  return getProject(orgId, id);
}

export async function deleteProject(orgId: string, userId: string, id: string) {
  const existing = await prisma.project.findFirst({ where: { id, orgId } });
  if (!existing) return false;
  await prisma.project.delete({ where: { id } });
  await createAuditLog({ orgId, userId, action: 'DELETE', entity: 'Project', entityId: id });
  return true;
}
