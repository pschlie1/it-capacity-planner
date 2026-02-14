// AI Context Builder - Creates comprehensive context from DB data for AI calls
import { getStoreFromDB } from './store-compat';
import * as settingsService from './services/settings';
import * as scenarioService from './services/scenarios';
import { runAllocationEngine, TeamData, ProjectData, ContractorData } from './allocation-engine';

export async function buildAIContext(orgId: string, options?: { scenarioId?: string; compact?: boolean }) {
  const store = await getStoreFromDB(orgId);
  const settings = await settingsService.getSettings(orgId);
  const scenarios = await scenarioService.getScenarios(orgId);

  const { teams, projects, resources, assignments, skillReqs } = store;

  // Run allocation engine
  const teamData: TeamData[] = teams.map(t => ({ ...t }));
  const projectData: ProjectData[] = projects.map(p => ({
    id: p.id, name: p.name, priority: p.priority, status: p.status,
    startWeekOffset: p.startWeekOffset,
    teamEstimates: p.teamEstimates.map((te: any) => ({
      teamId: te.teamId, design: te.design, development: te.development,
      testing: te.testing, deployment: te.deployment, postDeploy: te.postDeploy,
    })),
  }));

  let contractors: ContractorData[] = [];
  let priorityOverrides: Record<string, number> = {};
  if (options?.scenarioId) {
    const scenario = scenarios.find(s => s.id === options.scenarioId);
    if (scenario) {
      contractors = scenario.contractors.map((c: any) => ({
        teamId: c.teamId, roleKey: c.roleKey, fte: c.fte, weeks: c.weeks, startWeek: c.startWeek,
      }));
      priorityOverrides = Object.fromEntries(scenario.priorityOverrides.map((o: any) => [o.projectId, o.priority]));
    }
  }

  const { allocations, teamCapacities } = runAllocationEngine(teamData, projectData, contractors, priorityOverrides);
  const feasibleProjects = allocations.filter(a => a.feasible);
  const infeasibleProjects = allocations.filter(a => !a.feasible);

  // Resource utilization
  const resourceSummaries = resources.map(r => {
    const resAssignments = assignments.filter(a => a.resourceId === r.id);
    const weeklyUtils = Array.from({ length: 52 }, (_, w) =>
      resAssignments.filter(a => w >= a.startWeek && w <= a.endWeek).reduce((s, a) => s + a.allocationPct, 0)
    );
    const avgUtil = weeklyUtils.reduce((s, v) => s + v, 0) / 52;
    const maxUtil = Math.max(0, ...weeklyUtils);
    const team = teams.find(t => t.id === r.teamId);
    return {
      name: r.name, title: r.title, team: team?.name || 'Unknown',
      role: r.roleType, seniority: r.seniority, costRate: r.hourlyCostRate,
      skills: r.skills.map((s: any) => `${s.name}(${s.proficiency})`).join(', '),
      avgUtilization: avgUtil.toFixed(0) + '%',
      peakUtilization: maxUtil + '%',
      assignmentCount: resAssignments.length,
      ptoWeeks: r.ptoBlocks.reduce((s: number, b: any) => s + (b.endWeek - b.startWeek + 1), 0),
    };
  });

  // Overallocated
  const overallocSummary = new Map<string, { name: string; peakPct: number; weeks: number[] }>();
  for (const res of resources) {
    for (let w = 0; w < 52; w++) {
      const util = assignments.filter(a => a.resourceId === res.id && w >= a.startWeek && w <= a.endWeek)
        .reduce((s, a) => s + a.allocationPct, 0);
      if (util > 100) {
        if (!overallocSummary.has(res.id)) {
          overallocSummary.set(res.id, { name: res.name, peakPct: util, weeks: [w] });
        } else {
          const entry = overallocSummary.get(res.id)!;
          entry.weeks.push(w);
          if (util > entry.peakPct) entry.peakPct = util;
        }
      }
    }
  }

  // SPOFs
  const spofs: any[] = [];
  const skillMap: Record<string, any[]> = {};
  for (const req of skillReqs) {
    if (!skillMap[req.skillName]) {
      skillMap[req.skillName] = resources.filter(r =>
        r.skills.some((s: any) => s.name === req.skillName && s.proficiency >= req.minProficiency)
      );
    }
  }
  const seen = new Set<string>();
  for (const [skillName, qualified] of Object.entries(skillMap)) {
    if (qualified.length === 1 && !seen.has(skillName)) {
      seen.add(skillName);
      spofs.push({
        skillName, resource: qualified[0],
        projects: skillReqs.filter(r => r.skillName === skillName).map(r => projects.find(p => p.id === r.projectId)?.name || 'Unknown'),
      });
    }
  }

  const allSkills = Array.from(new Set(resources.flatMap(r => r.skills.map((s: any) => s.name)))).sort();

  const allEstimates = projects.flatMap(p => p.teamEstimates);

  const context = `
## IT Capacity Planning - Full Context

### Organization Overview
- ${teams.length} teams, ${resources.length} resources (${resources.reduce((s, r) => s + r.baseHoursPerWeek, 0) / 40} FTE)
- ${projects.length} projects in portfolio
- Planning window: 52 weeks
- Fiscal year starts month ${settings?.fiscalYearStartMonth || 1}

### Teams (${teams.length})
${teams.map(t => {
  const tc = teamCapacities.find((c: any) => c.teamId === t.id);
  const teamRes = resources.filter(r => r.teamId === t.id);
  return `**${t.name}** | ${teamRes.length} people | Skills: ${t.skills?.join(', ') || 'N/A'}
  Capacity: ${tc?.projectCapacityPerWeek.toFixed(0)}h/wk | Utilization: ${tc?.utilization.toFixed(1)}% | KLO/TLM: ${t.kloTlmHoursPerWeek}h | Admin: ${t.adminPct}%
  Roles: Dev=${t.developerFte}, Arch=${t.architectFte}, QA=${t.qaFte}, DevOps=${t.devopsFte}, BA=${t.businessAnalystFte}, PM=${t.pmFte}, DBA=${t.dbaFte}`;
}).join('\n\n')}

### Resources (${resources.length})
${resourceSummaries.map(r => `- **${r.name}** (${r.seniority} ${r.role}, ${r.team}) | $${r.costRate}/hr | Skills: ${r.skills} | Avg Util: ${r.avgUtilization}, Peak: ${r.peakUtilization} | ${r.assignmentCount} assignments${r.ptoWeeks > 0 ? ` | ${r.ptoWeeks}wk PTO` : ''}`).join('\n')}

### Projects (${projects.length}, by priority)
${projects.map(p => {
  const alloc = allocations.find(a => a.projectId === p.id);
  const ests = allEstimates.filter((te: any) => te.projectId === p.id);
  const totalHours = ests.reduce((sum: number, te: any) => sum + te.design + te.development + te.testing + te.deployment + te.postDeploy, 0);
  const projAssignments = assignments.filter(a => a.projectId === p.id);
  const assignedNames = projAssignments.map(a => {
    const res = resources.find(r => r.id === a.resourceId);
    return res ? `${res.name}(${a.allocationPct}%)` : '';
  }).filter(Boolean).join(', ');
  return `${p.priority}. **${p.name}** [${p.status}] ${p.businessValue ? `| Value: ${p.businessValue}` : ''} ${p.riskLevel ? `| Risk: ${p.riskLevel}` : ''}
   Category: ${p.category || 'N/A'} | Sponsor: ${p.sponsor || 'N/A'} | Size: ${p.tshirtSize || 'N/A'} | Target: ${p.quarterTarget || 'N/A'}
   Hours: ${totalHours}h | ${alloc?.feasible ? '✅ Feasible' : '❌ Over capacity'} | Wk ${alloc?.startWeek}-${alloc?.endWeek} (${alloc?.totalWeeks}wk)${alloc?.bottleneck ? ` | Bottleneck: ${alloc.bottleneck.teamName}` : ''}
   ${p.committedDate ? `Committed: ${p.committedDate}` : ''}${p.riskNotes ? ` | Risk Notes: ${p.riskNotes}` : ''}
   ${p.requiredSkills?.length ? `Required Skills: ${p.requiredSkills.join(', ')}` : ''}
   ${p.dependencies?.length ? `Dependencies: ${p.dependencies.map((d: string) => projects.find(pr => pr.id === d)?.name).filter(Boolean).join(', ')}` : ''}
   Assigned: ${assignedNames || 'None'}`;
}).join('\n\n')}

### Capacity Summary
- Total weekly project capacity: ${teamCapacities.reduce((s: number, tc: any) => s + tc.projectCapacityPerWeek, 0).toFixed(0)}h/wk
- Average utilization: ${(teamCapacities.reduce((s: number, tc: any) => s + tc.utilization, 0) / (teamCapacities.length || 1)).toFixed(1)}%
- ${feasibleProjects.length} projects feasible, ${infeasibleProjects.length} exceed capacity
${infeasibleProjects.length > 0 ? `- Below red line: ${infeasibleProjects.map(p => p.projectName).join(', ')}` : ''}

### Resource Conflicts & Over-allocations
${overallocSummary.size > 0 ? Array.from(overallocSummary.values()).map(o => `- **${o.name}**: Over-allocated in ${o.weeks.length} weeks, peak ${o.peakPct}%`).join('\n') : 'No over-allocations detected.'}

### Single Points of Failure
${spofs.length > 0 ? spofs.map(s => `- **${s.skillName}**: Only ${s.resource.name} qualifies. Affects: ${s.projects.join(', ')}`).join('\n') : 'No single points of failure detected.'}

### Available Skills
${allSkills.join(', ')}

### Scenarios
${scenarios.map((s: any) => `- ${s.name}${s.locked ? ' (locked)' : ''}`).join('\n')}
`;

  return {
    contextText: context,
    data: {
      teams, projects, resources, assignments, allocations, teamCapacities,
      overallocated: Array.from(overallocSummary.values()),
      spofs, feasibleCount: feasibleProjects.length, infeasibleCount: infeasibleProjects.length,
      infeasibleProjects: infeasibleProjects.map(p => p.projectName),
      allSkills, settings, scenarios,
    }
  };
}
