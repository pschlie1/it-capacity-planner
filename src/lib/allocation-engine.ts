// Allocation Engine - Priority-based, role-aware, week-by-week capacity scheduling

export interface TeamData {
  id: string;
  name: string;
  pmFte: number;
  productManagerFte: number;
  uxDesignerFte: number | null;
  businessAnalystFte: number;
  scrumMasterFte: number;
  architectFte: number;
  developerFte: number;
  qaFte: number;
  devopsFte: number;
  dbaFte: number;
  kloTlmHoursPerWeek: number;
  adminPct: number;
}

export interface ProjectData {
  id: string;
  name: string;
  priority: number;
  status: string;
  startWeekOffset: number;
  teamEstimates: {
    teamId: string;
    design: number;
    development: number;
    testing: number;
    deployment: number;
    postDeploy: number;
  }[];
}

export interface ContractorData {
  teamId: string;
  roleKey: string;
  fte: number;
  weeks: number;
  startWeek: number;
}

export interface AllocationResult {
  projectId: string;
  projectName: string;
  priority: number;
  feasible: boolean;
  startWeek: number;
  endWeek: number;
  totalWeeks: number;
  bottleneck: { teamId: string; teamName: string; role: string } | null;
  teamAllocations: {
    teamId: string;
    teamName: string;
    phases: {
      phase: string;
      startWeek: number;
      endWeek: number;
      hoursPerWeek: number[];
    }[];
  }[];
}

export interface TeamCapacity {
  teamId: string;
  teamName: string;
  totalHoursPerWeek: number;
  kloTlmHours: number;
  adminHours: number;
  projectCapacityPerWeek: number;
  utilization: number; // percentage of project capacity used
  allocatedHours: number;
  roles: Record<string, { fte: number; hoursPerWeek: number }>;
}

const WEEKS_IN_YEAR = 52;
const HOURS_PER_WEEK = 40;

// Map phases to roles
const PHASE_ROLE_MAP: Record<string, string> = {
  design: 'architect',
  development: 'developer',
  testing: 'qa',
  deployment: 'devops',
  postDeploy: 'devops',
};

function getTeamRoles(team: TeamData): Record<string, number> {
  return {
    pm: team.pmFte,
    productManager: team.productManagerFte,
    uxDesigner: team.uxDesignerFte ?? 0,
    businessAnalyst: team.businessAnalystFte,
    scrumMaster: team.scrumMasterFte,
    architect: team.architectFte,
    developer: team.developerFte,
    qa: team.qaFte,
    devops: team.devopsFte,
    dba: team.dbaFte,
  };
}

function getTotalFte(team: TeamData): number {
  const roles = getTeamRoles(team);
  return Object.values(roles).reduce((sum, v) => sum + v, 0);
}

export function calculateTeamCapacity(team: TeamData, contractors: ContractorData[] = []): TeamCapacity {
  const roles = getTeamRoles(team);
  const totalFte = getTotalFte(team);
  const totalHoursPerWeek = totalFte * HOURS_PER_WEEK;
  const afterKlo = totalHoursPerWeek - team.kloTlmHoursPerWeek;
  const adminHours = afterKlo * (team.adminPct / 100);
  const projectCapacity = Math.max(0, afterKlo - adminHours);

  // Add contractor capacity
  const contractorHours: Record<string, number> = {};
  for (const c of contractors.filter(c => c.teamId === team.id)) {
    contractorHours[c.roleKey] = (contractorHours[c.roleKey] || 0) + c.fte * HOURS_PER_WEEK;
  }

  const roleCapacities: Record<string, { fte: number; hoursPerWeek: number }> = {};
  for (const [role, fte] of Object.entries(roles)) {
    if (fte > 0 || contractorHours[role]) {
      const baseHours = totalFte > 0 ? (fte / totalFte) * projectCapacity : 0;
      roleCapacities[role] = {
        fte: fte + (contractorHours[role] ? contractorHours[role] / HOURS_PER_WEEK : 0),
        hoursPerWeek: baseHours + (contractorHours[role] || 0),
      };
    }
  }

  return {
    teamId: team.id,
    teamName: team.name,
    totalHoursPerWeek,
    kloTlmHours: team.kloTlmHoursPerWeek,
    adminHours,
    projectCapacityPerWeek: projectCapacity,
    utilization: 0,
    allocatedHours: 0,
    roles: roleCapacities,
  };
}

export function runAllocationEngine(
  teams: TeamData[],
  projects: ProjectData[],
  contractors: ContractorData[] = [],
  priorityOverrides: Record<string, number> = {}
): { allocations: AllocationResult[]; teamCapacities: TeamCapacity[] } {
  // Sort projects by priority (with overrides)
  const sortedProjects = [...projects].sort((a, b) => {
    const pa = priorityOverrides[a.id] ?? a.priority;
    const pb = priorityOverrides[b.id] ?? b.priority;
    return pa - pb;
  });

  // Initialize per-role, per-week capacity grid for each team
  const teamCapacities = teams.map(t => calculateTeamCapacity(t, contractors));
  
  // capacity[teamId][role][week] = remaining hours
  const capacity: Record<string, Record<string, number[]>> = {};
  for (const tc of teamCapacities) {
    capacity[tc.teamId] = {};
    for (const [role, data] of Object.entries(tc.roles)) {
      capacity[tc.teamId][role] = Array(WEEKS_IN_YEAR).fill(data.hoursPerWeek);
    }
    // Apply contractor durations
    for (const c of contractors.filter(c => c.teamId === tc.teamId)) {
      if (!capacity[tc.teamId][c.roleKey]) {
        capacity[tc.teamId][c.roleKey] = Array(WEEKS_IN_YEAR).fill(0);
      }
      const contractorHoursPerWeek = c.fte * HOURS_PER_WEEK;
      for (let w = 0; w < WEEKS_IN_YEAR; w++) {
        if (w >= c.startWeek && w < c.startWeek + c.weeks) {
          // Already added in calculateTeamCapacity, but for duration-limited:
          // We need to remove contractor hours outside their window
        } else {
          capacity[tc.teamId][c.roleKey][w] -= contractorHoursPerWeek;
          if (capacity[tc.teamId][c.roleKey][w] < 0) capacity[tc.teamId][c.roleKey][w] = 0;
        }
      }
    }
  }

  const allocations: AllocationResult[] = [];
  const teamTotalAllocated: Record<string, number> = {};

  for (const project of sortedProjects) {
    if (project.status === 'complete') continue;
    
    const effectivePriority = priorityOverrides[project.id] ?? project.priority;
    const teamAllocs: AllocationResult['teamAllocations'] = [];
    let projectStart = WEEKS_IN_YEAR;
    let projectEnd = 0;
    let bottleneckWeeks = 0;
    let bottleneck: AllocationResult['bottleneck'] = null;

    for (const estimate of project.teamEstimates) {
      const teamCap = capacity[estimate.teamId];
      if (!teamCap) continue;

      const team = teams.find(t => t.id === estimate.teamId);
      if (!team) continue;

      const phases: { phase: string; hours: number }[] = [
        { phase: 'design', hours: estimate.design },
        { phase: 'development', hours: estimate.development },
        { phase: 'testing', hours: estimate.testing },
        { phase: 'deployment', hours: estimate.deployment },
        { phase: 'postDeploy', hours: estimate.postDeploy },
      ].filter(p => p.hours > 0);

      let currentWeek = project.startWeekOffset;
      const teamPhases: AllocationResult['teamAllocations'][0]['phases'] = [];

      for (const { phase, hours } of phases) {
        const role = PHASE_ROLE_MAP[phase] || 'developer';
        const roleCapacity = teamCap[role];
        if (!roleCapacity) {
          // Use developer as fallback
          const fallback = teamCap['developer'];
          if (!fallback) continue;
        }

        const cap = teamCap[role] || teamCap['developer'];
        if (!cap) continue;

        let remaining = hours;
        const phaseStart = currentWeek;
        const hoursPerWeek: number[] = [];

        while (remaining > 0 && currentWeek < WEEKS_IN_YEAR) {
          const available = cap[currentWeek] || 0;
          const allocated = Math.min(remaining, available);
          if (allocated > 0) {
            cap[currentWeek] -= allocated;
            remaining -= allocated;
            hoursPerWeek.push(allocated);
            teamTotalAllocated[estimate.teamId] = (teamTotalAllocated[estimate.teamId] || 0) + allocated;
          } else {
            hoursPerWeek.push(0);
          }
          currentWeek++;
        }

        teamPhases.push({
          phase,
          startWeek: phaseStart,
          endWeek: currentWeek - 1,
          hoursPerWeek,
        });
      }

      const teamEndWeek = teamPhases.length > 0 ? Math.max(...teamPhases.map(p => p.endWeek)) : 0;
      const teamStartWeek = teamPhases.length > 0 ? Math.min(...teamPhases.map(p => p.startWeek)) : 0;
      
      if (teamEndWeek > projectEnd) projectEnd = teamEndWeek;
      if (teamStartWeek < projectStart) projectStart = teamStartWeek;

      if (teamEndWeek - teamStartWeek > bottleneckWeeks) {
        bottleneckWeeks = teamEndWeek - teamStartWeek;
        bottleneck = {
          teamId: estimate.teamId,
          teamName: team.name,
          role: 'Multiple',
        };
      }

      teamAllocs.push({
        teamId: estimate.teamId,
        teamName: team.name,
        phases: teamPhases,
      });
    }

    const feasible = projectEnd < WEEKS_IN_YEAR;

    allocations.push({
      projectId: project.id,
      projectName: project.name,
      priority: effectivePriority,
      feasible,
      startWeek: projectStart < WEEKS_IN_YEAR ? projectStart : 0,
      endWeek: Math.min(projectEnd, WEEKS_IN_YEAR - 1),
      totalWeeks: projectEnd - (projectStart < WEEKS_IN_YEAR ? projectStart : 0) + 1,
      bottleneck,
      teamAllocations: teamAllocs,
    });
  }

  // Calculate utilization
  for (const tc of teamCapacities) {
    const totalProjectCapacity = tc.projectCapacityPerWeek * WEEKS_IN_YEAR;
    tc.allocatedHours = teamTotalAllocated[tc.teamId] || 0;
    tc.utilization = totalProjectCapacity > 0 ? (tc.allocatedHours / totalProjectCapacity) * 100 : 0;
  }

  return { allocations, teamCapacities };
}
