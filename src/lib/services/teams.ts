import { prisma } from '../db';
import { createAuditLog } from './audit';

export async function getTeams(orgId: string) {
  const teams = await prisma.team.findMany({ where: { orgId }, orderBy: { name: 'asc' } });
  return teams.map(t => ({ ...t, skills: (t.skills || []) as string[] }));
}

export async function getTeam(orgId: string, id: string) {
  const team = await prisma.team.findFirst({ where: { id, orgId } });
  if (!team) return null;
  return { ...team, skills: (team.skills || []) as string[] };
}

export async function createTeam(orgId: string, userId: string, data: any) {
  const { skills, ...rest } = data;
  const team = await prisma.team.create({
    data: { ...rest, skills: skills || [], orgId },
  });
  await createAuditLog({ orgId, userId, action: 'CREATE', entity: 'Team', entityId: team.id, changes: { after: data } });
  return { ...team, skills: (team.skills || []) as string[] };
}

export async function updateTeam(orgId: string, userId: string, id: string, data: any) {
  const existing = await prisma.team.findFirst({ where: { id, orgId } });
  if (!existing) return null;
  const { skills, ...rest } = data;
  const updateData: any = { ...rest };
  if (skills !== undefined) updateData.skills = skills;
  const team = await prisma.team.update({ where: { id }, data: updateData });
  await createAuditLog({ orgId, userId, action: 'UPDATE', entity: 'Team', entityId: id, changes: { before: existing, after: data } });
  return { ...team, skills: (team.skills || []) as string[] };
}

export async function deleteTeam(orgId: string, userId: string, id: string) {
  const existing = await prisma.team.findFirst({ where: { id, orgId } });
  if (!existing) return false;
  await prisma.team.delete({ where: { id } });
  await createAuditLog({ orgId, userId, action: 'DELETE', entity: 'Team', entityId: id, changes: { before: existing } });
  return true;
}
