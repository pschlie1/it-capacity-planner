import { prisma } from '../db';
import { createAuditLog } from './audit';

export async function getScenarios(orgId: string) {
  const scenarios = await prisma.scenario.findMany({
    where: { orgId },
    include: {
      priorityOverrides: { select: { projectId: true, priority: true } },
      contractors: { include: { team: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  });
  return scenarios;
}

export async function getScenario(orgId: string, id: string) {
  return prisma.scenario.findFirst({
    where: { id, orgId },
    include: {
      priorityOverrides: { select: { projectId: true, priority: true } },
      contractors: { include: { team: { select: { name: true } } } },
    },
  });
}

export async function createScenario(orgId: string, userId: string, data: { name: string; locked?: boolean }) {
  const scenario = await prisma.scenario.create({
    data: { name: data.name, locked: data.locked || false, orgId },
  });
  await createAuditLog({ orgId, userId, action: 'CREATE', entity: 'Scenario', entityId: scenario.id });
  return getScenario(orgId, scenario.id);
}

export async function updateScenario(orgId: string, userId: string, id: string, data: any) {
  const existing = await prisma.scenario.findFirst({ where: { id, orgId } });
  if (!existing) return null;
  await prisma.scenario.update({ where: { id }, data: { name: data.name, locked: data.locked } });
  await createAuditLog({ orgId, userId, action: 'UPDATE', entity: 'Scenario', entityId: id });
  return getScenario(orgId, id);
}

export async function deleteScenario(orgId: string, userId: string, id: string) {
  const existing = await prisma.scenario.findFirst({ where: { id, orgId } });
  if (!existing) return false;
  await prisma.scenario.delete({ where: { id } });
  await createAuditLog({ orgId, userId, action: 'DELETE', entity: 'Scenario', entityId: id });
  return true;
}

export async function addContractor(orgId: string, userId: string, scenarioId: string, data: any) {
  const scenario = await prisma.scenario.findFirst({ where: { id: scenarioId, orgId } });
  if (!scenario) return null;
  const contractor = await prisma.contractor.create({
    data: { ...data, scenarioId, orgId },
  });
  await createAuditLog({ orgId, userId, action: 'CREATE', entity: 'Contractor', entityId: contractor.id });
  return contractor;
}

export async function removeContractor(orgId: string, userId: string, scenarioId: string, contractorId: string) {
  const contractor = await prisma.contractor.findFirst({ where: { id: contractorId, orgId, scenarioId } });
  if (!contractor) return false;
  await prisma.contractor.delete({ where: { id: contractorId } });
  await createAuditLog({ orgId, userId, action: 'DELETE', entity: 'Contractor', entityId: contractorId });
  return true;
}
