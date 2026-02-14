import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { getStoreFromDB } from '@/lib/store-compat';

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const store = await getStoreFromDB(auth.orgId);

  if (projectId) {
    const reqs = store.skillReqs.filter(r => r.projectId === projectId);
    const gaps = reqs.map(req => {
      const available = store.resources
        .filter(r => r.skills.some((s: any) => s.name === req.skillName && s.proficiency >= req.minProficiency))
        .map(r => ({ resource: r, proficiency: r.skills.find((s: any) => s.name === req.skillName)!.proficiency }));
      return { skillName: req.skillName, minProficiency: req.minProficiency, availableResources: available, gap: available.length === 0 };
    });
    return NextResponse.json({ gaps, recommendations: [] });
  }

  // Build skill matrix
  const skillSet = new Set<string>();
  store.resources.forEach(r => r.skills.forEach((s: any) => skillSet.add(s.name)));
  const skills = Array.from(skillSet).sort();

  const matrix = skills.map(skill => {
    const teamData: Record<string, any> = {};
    for (const team of store.teams) {
      const teamResources = store.resources.filter(r => r.teamId === team.id && r.skills.some((s: any) => s.name === skill));
      if (teamResources.length > 0) {
        const profs = teamResources.map(r => r.skills.find((s: any) => s.name === skill)!.proficiency);
        teamData[team.id] = {
          count: teamResources.length,
          maxProficiency: Math.max(...profs),
          avgProficiency: profs.reduce((a: number, b: number) => a + b, 0) / profs.length,
          people: teamResources.map(r => r.name),
        };
      }
    }
    return { skill, teams: teamData };
  });

  // Single points of failure
  const spof: any[] = [];
  const skillMap: Record<string, any[]> = {};
  for (const req of store.skillReqs) {
    if (!skillMap[req.skillName]) {
      skillMap[req.skillName] = store.resources.filter(r =>
        r.skills.some((s: any) => s.name === req.skillName && s.proficiency >= req.minProficiency)
      );
    }
  }
  const seen = new Set<string>();
  for (const [skillName, qualified] of Object.entries(skillMap)) {
    if (qualified.length === 1 && !seen.has(skillName)) {
      seen.add(skillName);
      const affectedProjects = store.skillReqs
        .filter(r => r.skillName === skillName)
        .map(r => store.projects.find(p => p.id === r.projectId)?.name || 'Unknown');
      spof.push({ skillName, resource: qualified[0], projects: affectedProjects });
    }
  }

  return NextResponse.json({ matrix, skills, singlePointsOfFailure: spof, teams: store.teams });
}
