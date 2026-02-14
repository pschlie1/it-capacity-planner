// Compatibility layer: provides the same interface as the old in-memory store
// but loads data from the database via services.
// Used by resource analytics functions that need the full dataset shape.

import { prisma } from './db';

export async function getStoreFromDB(orgId: string) {
  const [teams, projects, resources, assignments, skillReqs] = await Promise.all([
    prisma.team.findMany({ where: { orgId } }),
    prisma.project.findMany({ where: { orgId }, include: { teamEstimates: true } }),
    prisma.resource.findMany({ where: { orgId } }),
    prisma.resourceAssignment.findMany({ where: { orgId } }),
    prisma.projectSkillRequirement.findMany({ where: { orgId } }),
  ]);

  return {
    teams: teams.map(t => ({ ...t, skills: JSON.parse(t.skills) })),
    projects: projects.map(p => ({
      ...p,
      requiredSkills: JSON.parse(p.requiredSkills),
      dependencies: JSON.parse(p.dependencies),
      milestones: JSON.parse(p.milestones),
      actualHours: JSON.parse(p.actualHours),
      teamEstimates: p.teamEstimates,
    })),
    resources: resources.map(r => ({
      ...r,
      skills: JSON.parse(r.skills),
      ptoBlocks: JSON.parse(r.ptoBlocks),
    })),
    assignments,
    skillReqs,
  };
}
