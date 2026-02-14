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
    teams: teams.map(t => ({ ...t, skills: (t.skills || []) as any[] })),
    projects: projects.map(p => ({
      ...p,
      requiredSkills: (p.requiredSkills || []) as any[],
      dependencies: (p.dependencies || []) as any[],
      milestones: (p.milestones || []) as any[],
      actualHours: (p.actualHours || {}) as any,
      teamEstimates: p.teamEstimates.map(te => ({
        ...te,
        roleBreakdown: (te.roleBreakdown || {}) as any,
      })),
    })),
    resources: resources.map(r => ({
      ...r,
      skills: (r.skills || []) as any[],
      ptoBlocks: (r.ptoBlocks || []) as any[],
    })),
    assignments,
    skillReqs,
  };
}
