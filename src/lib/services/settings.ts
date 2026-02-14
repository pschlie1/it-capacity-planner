import { prisma } from '../db';
import { createAuditLog } from './audit';

export async function getSettings(orgId: string) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return null;
  const parseJson = (val: unknown, fallback: unknown[] = []) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fallback; } }
    return fallback;
  };

  return {
    fiscalYearStartMonth: org.fiscalYearStartMonth,
    defaultHoursPerWeek: org.defaultHoursPerWeek,
    blendedRate: org.blendedRate ?? 95,
    holidays: parseJson(org.holidays),
    capacityThresholds: { amber: org.capacityAmber, red: org.capacityRed },
    roleTemplates: parseJson(org.roleTemplates),
    estimationConfig: typeof org.estimationConfig === 'object' ? org.estimationConfig : {},
  };
}

export async function updateSettings(orgId: string, userId: string, data: any) {
  const updateData: any = {};
  if (data.fiscalYearStartMonth !== undefined) updateData.fiscalYearStartMonth = data.fiscalYearStartMonth;
  if (data.defaultHoursPerWeek !== undefined) updateData.defaultHoursPerWeek = data.defaultHoursPerWeek;
  if (data.blendedRate !== undefined) updateData.blendedRate = data.blendedRate;
  if (data.holidays !== undefined) updateData.holidays = data.holidays;
  if (data.capacityThresholds !== undefined) {
    updateData.capacityAmber = data.capacityThresholds.amber;
    updateData.capacityRed = data.capacityThresholds.red;
  }
  if (data.roleTemplates !== undefined) updateData.roleTemplates = data.roleTemplates;
  if (data.estimationConfig !== undefined) updateData.estimationConfig = data.estimationConfig;

  await prisma.organization.update({ where: { id: orgId }, data: updateData });
  await createAuditLog({ orgId, userId, action: 'UPDATE', entity: 'Organization', entityId: orgId, changes: data });
  return getSettings(orgId);
}

export async function getPTOEntries(orgId: string, teamId?: string) {
  const where: any = { orgId };
  if (teamId) where.teamId = teamId;
  return prisma.pTOEntry.findMany({ where });
}

export async function addPTOEntry(orgId: string, userId: string, data: any) {
  const entry = await prisma.pTOEntry.create({ data: { ...data, orgId } });
  await createAuditLog({ orgId, userId, action: 'CREATE', entity: 'PTOEntry', entityId: entry.id });
  return entry;
}

export async function removePTOEntry(orgId: string, userId: string, id: string) {
  const existing = await prisma.pTOEntry.findFirst({ where: { id, orgId } });
  if (!existing) return false;
  await prisma.pTOEntry.delete({ where: { id } });
  return true;
}

export async function getNewHires(orgId: string, teamId?: string) {
  const where: any = { orgId };
  if (teamId) where.teamId = teamId;
  return prisma.newHire.findMany({ where });
}

export async function addNewHire(orgId: string, userId: string, data: any) {
  const entry = await prisma.newHire.create({ data: { ...data, orgId } });
  await createAuditLog({ orgId, userId, action: 'CREATE', entity: 'NewHire', entityId: entry.id });
  return entry;
}

export async function removeNewHire(orgId: string, userId: string, id: string) {
  const existing = await prisma.newHire.findFirst({ where: { id, orgId } });
  if (!existing) return false;
  await prisma.newHire.delete({ where: { id } });
  return true;
}

export async function getActuals(orgId: string, projectId?: string) {
  const where: any = { orgId };
  if (projectId) where.projectId = projectId;
  return prisma.actualEntry.findMany({ where });
}

export async function addActual(orgId: string, userId: string, data: any) {
  const entry = await prisma.actualEntry.create({ data: { ...data, orgId } });
  return entry;
}
