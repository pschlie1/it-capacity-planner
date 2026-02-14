import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { getStoreFromDB } from '@/lib/store-compat';

function getResourceUtilization(resourceId: string, week: number, assignments: any[]) {
  return assignments
    .filter(a => a.resourceId === resourceId && week >= a.startWeek && week <= a.endWeek)
    .reduce((sum, a) => sum + a.allocationPct, 0);
}

function getWeeklyUtil(resourceId: string, assignments: any[]) {
  const weeks: number[] = [];
  for (let w = 0; w < 52; w++) weeks.push(getResourceUtilization(resourceId, w, assignments));
  return weeks;
}

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const store = await getStoreFromDB(auth.orgId);
  const { resources, teams, assignments, skillReqs } = store;

  const resourceUtilization = resources.map(r => {
    const util = getWeeklyUtil(r.id, assignments);
    const avg = util.reduce((a, b) => a + b, 0) / 52;
    const team = teams.find(t => t.id === r.teamId);
    return { id: r.id, name: r.name, teamName: team?.name, avgUtilization: avg, maxUtilization: Math.max(...util, 0), seniority: r.seniority, roleType: r.roleType };
  }).sort((a, b) => b.avgUtilization - a.avgUtilization);

  const contentionMap: Record<string, number> = {};
  assignments.forEach(a => { contentionMap[a.resourceId] = (contentionMap[a.resourceId] || 0) + 1; });
  const mostContested = Object.entries(contentionMap)
    .map(([id, count]) => {
      const r = resources.find(res => res.id === id)!;
      return { id, name: r?.name, projectCount: count, teamName: teams.find(t => t.id === r?.teamId)?.name };
    })
    .sort((a, b) => b.projectCount - a.projectCount)
    .slice(0, 10);

  const seniorityByTeam = teams.map(t => {
    const teamResources = resources.filter(r => r.teamId === t.id);
    const dist: Record<string, number> = { Junior: 0, Mid: 0, Senior: 0, Lead: 0, Principal: 0 };
    teamResources.forEach(r => { dist[r.seniority]++; });
    return { teamId: t.id, teamName: t.name, total: teamResources.length, ...dist };
  });

  const burnoutRisk = resources.map(r => {
    const util = getWeeklyUtil(r.id, assignments);
    let maxConsecutive = 0, current = 0;
    for (const u of util) { if (u >= 85) { current++; maxConsecutive = Math.max(maxConsecutive, current); } else current = 0; }
    return { id: r.id, name: r.name, maxConsecutiveHighWeeks: maxConsecutive, atRisk: maxConsecutive >= 4, teamName: teams.find(t => t.id === r.teamId)?.name };
  }).filter(r => r.atRisk);

  const roleNeeds: Record<string, { current: number; avgUtil: number }> = {};
  resources.forEach(r => {
    if (!roleNeeds[r.roleType]) roleNeeds[r.roleType] = { current: 0, avgUtil: 0 };
    roleNeeds[r.roleType].current++;
    const util = getWeeklyUtil(r.id, assignments);
    roleNeeds[r.roleType].avgUtil += util.reduce((a, b) => a + b, 0) / 52;
  });
  Object.keys(roleNeeds).forEach(k => { roleNeeds[k].avgUtil /= roleNeeds[k].current; });

  // Overallocated
  const overallocated: any[] = [];
  for (const res of resources) {
    for (let w = 0; w < 52; w++) {
      const util = getResourceUtilization(res.id, w, assignments);
      if (util > 100) overallocated.push({ resource: res, week: w, totalPct: util });
    }
  }

  // Skill matrix
  const skillSet = new Set<string>();
  resources.forEach(r => r.skills.forEach((s: any) => skillSet.add(s.name)));
  const allSkills = Array.from(skillSet).sort();
  const skillMatrix = allSkills.map(skill => {
    const teamData: Record<string, any> = {};
    for (const team of teams) {
      const tr = resources.filter(r => r.teamId === team.id && r.skills.some((s: any) => s.name === skill));
      if (tr.length) {
        const profs = tr.map(r => r.skills.find((s: any) => s.name === skill)!.proficiency);
        teamData[team.id] = { count: tr.length, maxProficiency: Math.max(...profs), avgProficiency: profs.reduce((a: number, b: number) => a + b, 0) / profs.length, people: tr.map(r => r.name) };
      }
    }
    return { skill, teams: teamData };
  });

  // SPOF
  const spof: any[] = [];
  const skillMap: Record<string, any[]> = {};
  for (const req of skillReqs) {
    if (!skillMap[req.skillName]) skillMap[req.skillName] = resources.filter(r => r.skills.some((s: any) => s.name === req.skillName && s.proficiency >= req.minProficiency));
  }
  const seen = new Set<string>();
  for (const [skillName, qualified] of Object.entries(skillMap)) {
    if (qualified.length === 1 && !seen.has(skillName)) {
      seen.add(skillName);
      spof.push({ skillName, resource: qualified[0], projects: skillReqs.filter(r => r.skillName === skillName).map(r => store.projects.find(p => p.id === r.projectId)?.name || 'Unknown') });
    }
  }

  return NextResponse.json({
    totalResources: resources.length,
    totalTeams: teams.length,
    resourceUtilization,
    mostContested,
    overallocatedCount: new Set(overallocated.map(o => o.resource.id)).size,
    overallocated: overallocated.slice(0, 20),
    singlePointsOfFailure: spof,
    seniorityByTeam,
    burnoutRisk,
    roleNeeds,
    skillMatrix,
    allSkills,
    productivity: { Junior: 0.5, Mid: 0.75, Senior: 1.0, Lead: 1.1, Principal: 1.2, mentorshipOverheadPct: 15 },
  });
}
