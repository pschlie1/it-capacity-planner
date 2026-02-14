import { prisma } from '../db';
import { createAuditLog } from './audit';

function serializeResource(r: any) {
  return {
    ...r,
    skills: JSON.parse(r.skills || '[]'),
    ptoBlocks: JSON.parse(r.ptoBlocks || '[]'),
  };
}

export async function getResources(orgId: string) {
  const resources = await prisma.resource.findMany({ where: { orgId }, orderBy: { name: 'asc' } });
  return resources.map(serializeResource);
}

export async function getResource(orgId: string, id: string) {
  const resource = await prisma.resource.findFirst({ where: { id, orgId } });
  if (!resource) return null;
  return serializeResource(resource);
}

export async function createResource(orgId: string, userId: string, data: any) {
  const { skills, ptoBlocks, ...rest } = data;
  const resource = await prisma.resource.create({
    data: {
      ...rest,
      skills: JSON.stringify(skills || []),
      ptoBlocks: JSON.stringify(ptoBlocks || []),
      orgId,
    },
  });
  await createAuditLog({ orgId, userId, action: 'CREATE', entity: 'Resource', entityId: resource.id });
  return serializeResource(resource);
}

export async function updateResource(orgId: string, userId: string, id: string, data: any) {
  const existing = await prisma.resource.findFirst({ where: { id, orgId } });
  if (!existing) return null;
  const { skills, ptoBlocks, ...rest } = data;
  const updateData: any = { ...rest };
  if (skills !== undefined) updateData.skills = JSON.stringify(skills);
  if (ptoBlocks !== undefined) updateData.ptoBlocks = JSON.stringify(ptoBlocks);
  const resource = await prisma.resource.update({ where: { id }, data: updateData });
  await createAuditLog({ orgId, userId, action: 'UPDATE', entity: 'Resource', entityId: id });
  return serializeResource(resource);
}

export async function getAssignments(orgId: string, filters?: { resourceId?: string; projectId?: string }) {
  const where: any = { orgId };
  if (filters?.resourceId) where.resourceId = filters.resourceId;
  if (filters?.projectId) where.projectId = filters.projectId;
  return prisma.resourceAssignment.findMany({ where });
}

export async function createAssignment(orgId: string, userId: string, data: any) {
  const assignment = await prisma.resourceAssignment.create({
    data: { ...data, orgId },
  });
  await createAuditLog({ orgId, userId, action: 'CREATE', entity: 'Assignment', entityId: assignment.id });
  return assignment;
}

export async function deleteAssignment(orgId: string, userId: string, id: string) {
  const existing = await prisma.resourceAssignment.findFirst({ where: { id, orgId } });
  if (!existing) return false;
  await prisma.resourceAssignment.delete({ where: { id } });
  await createAuditLog({ orgId, userId, action: 'DELETE', entity: 'Assignment', entityId: id });
  return true;
}

export async function getSkillRequirements(orgId: string, projectId?: string) {
  const where: any = { orgId };
  if (projectId) where.projectId = projectId;
  return prisma.projectSkillRequirement.findMany({ where });
}

export async function getProductivitySettings() {
  // Static for now - could be moved to org settings
  return {
    Junior: 0.5, Mid: 0.75, Senior: 1.0, Lead: 1.1, Principal: 1.2,
    mentorshipOverheadPct: 15,
  };
}
