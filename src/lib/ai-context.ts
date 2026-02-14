// AI Context Builder - Creates comprehensive context from all store data for AI calls
import { getTeams, getProjects, getTeamEstimates, getScenarios, getContractors, getPriorityOverrides, getActuals, getSettings } from './store';
import { getResources, getAssignments, getProjectSkillRequirements, getOverallocatedResources, getSinglePointsOfFailure, getSkillGaps, getAllSkills } from './resource-store';
import { runAllocationEngine, TeamData, ProjectData, ContractorData } from './allocation-engine';

export function buildAIContext(options?: { scenarioId?: string; compact?: boolean }) {
  const teams = getTeams();
  const projects = getProjects();
  const allEstimates = getTeamEstimates();
  const resources = getResources();
  const assignments = getAssignments();
  const skillReqs = getProjectSkillRequirements();
  const overallocated = getOverallocatedResources();
  const spofs = getSinglePointsOfFailure();
  const settings = getSettings();
  const scenarios = getScenarios();
  const allSkills = getAllSkills();

  // Run allocation engine
  const teamData: TeamData[] = teams.map(t => ({ ...t }));
  const projectData: ProjectData[] = projects.map(p => ({
    id: p.id, name: p.name, priority: p.priority, status: p.status,
    startWeekOffset: p.startWeekOffset,
    teamEstimates: allEstimates.filter(te => te.projectId === p.id).map(te => ({
      teamId: te.teamId, design: te.design, development: te.development,
      testing: te.testing, deployment: te.deployment, postDeploy: te.postDeploy,
    })),
  }));

  let contractors: ContractorData[] = [];
  let priorityOverrides: Record<string, number> = {};
  if (options?.scenarioId) {
    contractors = getContractors(options.scenarioId).map(c => ({
      teamId: c.teamId, roleKey: c.roleKey, fte: c.fte, weeks: c.weeks, startWeek: c.startWeek,
    }));
    const overrides = getPriorityOverrides(options.scenarioId);
    priorityOverrides = Object.fromEntries(overrides.map(o => [o.projectId, o.priority]));
  }

  const { allocations, teamCapacities } = runAllocationEngine(teamData, projectData, contractors, priorityOverrides);
  const feasibleProjects = allocations.filter(a => a.feasible);
  const infeasibleProjects = allocations.filter(a => !a.feasible);

  // Build resource utilization summary
  const resourceSummaries = resources.map(r => {
    const resAssignments = assignments.filter(a => a.resourceId === r.id);
    const maxUtil = Math.max(0, ...Array.from({ length: 52 }, (_, w) =>
      resAssignments.filter(a => w >= a.startWeek && w <= a.endWeek).reduce((s, a) => s + a.allocationPct, 0)
    ));
    const avgUtil = Array.from({ length: 52 }, (_, w) =>
      resAssignments.filter(a => w >= a.startWeek && w <= a.endWeek).reduce((s, a) => s + a.allocationPct, 0)
    ).reduce((s, v) => s + v, 0) / 52;
    const team = teams.find(t => t.id === r.teamId);
    return {
      name: r.name, title: r.title, team: team?.name || 'Unknown',
      role: r.roleType, seniority: r.seniority, costRate: r.hourlyCostRate,
      skills: r.skills.map(s => `${s.name}(${s.proficiency})`).join(', '),
      avgUtilization: avgUtil.toFixed(0) + '%',
      peakUtilization: maxUtil + '%',
      assignmentCount: resAssignments.length,
      ptoWeeks: r.ptoBlocks.reduce((s, b) => s + (b.endWeek - b.startWeek + 1), 0),
    };
  });

  // Over-allocated weeks summary
  const overallocSummary = new Map<string, { name: string; peakPct: number; weeks: number[] }>();
  for (const o of overallocated) {
    const key = o.resource.id;
    if (!overallocSummary.has(key)) {
      overallocSummary.set(key, { name: o.resource.name, peakPct: o.totalPct, weeks: [o.week] });
    } else {
      const entry = overallocSummary.get(key)!;
      entry.weeks.push(o.week);
      if (o.totalPct > entry.peakPct) entry.peakPct = o.totalPct;
    }
  }

  const context = `
## IT Capacity Planning - Full Context

### Organization Overview
- ${teams.length} teams, ${resources.length} resources (${resources.reduce((s, r) => s + r.baseHoursPerWeek, 0) / 40} FTE)
- ${projects.length} projects in portfolio
- Planning window: 52 weeks
- Fiscal year starts month ${settings.fiscalYearStartMonth}

### Teams (${teams.length})
${teams.map(t => {
  const tc = teamCapacities.find(c => c.teamId === t.id);
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
  const ests = allEstimates.filter(te => te.projectId === p.id);
  const totalHours = ests.reduce((sum, te) => sum + te.design + te.development + te.testing + te.deployment + te.postDeploy, 0);
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
   ${p.dependencies?.length ? `Dependencies: ${p.dependencies.map(d => projects.find(pr => pr.id === d)?.name).filter(Boolean).join(', ')}` : ''}
   Assigned: ${assignedNames || 'None'}`;
}).join('\n\n')}

### Capacity Summary
- Total weekly project capacity: ${teamCapacities.reduce((s, tc) => s + tc.projectCapacityPerWeek, 0).toFixed(0)}h/wk
- Average utilization: ${(teamCapacities.reduce((s, tc) => s + tc.utilization, 0) / teamCapacities.length).toFixed(1)}%
- Most utilized: ${teamCapacities.sort((a, b) => b.utilization - a.utilization)[0]?.teamName} (${teamCapacities.sort((a, b) => b.utilization - a.utilization)[0]?.utilization.toFixed(1)}%)
- Least utilized: ${teamCapacities.sort((a, b) => a.utilization - b.utilization)[0]?.teamName} (${teamCapacities.sort((a, b) => a.utilization - b.utilization)[0]?.utilization.toFixed(1)}%)
- ${feasibleProjects.length} projects feasible, ${infeasibleProjects.length} exceed capacity
${infeasibleProjects.length > 0 ? `- Below red line: ${infeasibleProjects.map(p => p.projectName).join(', ')}` : ''}

### Resource Conflicts & Over-allocations
${overallocSummary.size > 0 ? Array.from(overallocSummary.values()).map(o => `- **${o.name}**: Over-allocated in ${o.weeks.length} weeks, peak ${o.peakPct}%`).join('\n') : 'No over-allocations detected.'}

### Single Points of Failure
${spofs.length > 0 ? spofs.map(s => `- **${s.skillName}**: Only ${s.resource.name} qualifies. Affects: ${s.projects.join(', ')}`).join('\n') : 'No single points of failure detected.'}

### Available Skills Across Organization
${allSkills.join(', ')}

### Scenarios
${scenarios.map(s => `- ${s.name}${s.locked ? ' (locked)' : ''}`).join('\n')}

### Current Assignments Detail
${assignments.map(a => {
  const res = resources.find(r => r.id === a.resourceId);
  const proj = projects.find(p => p.id === a.projectId);
  return `- ${res?.name || '?'} → ${proj?.name || '?'} as ${a.role} @ ${a.allocationPct}% (wk ${a.startWeek}-${a.endWeek})`;
}).join('\n')}
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
