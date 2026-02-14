/**
 * Estimation Engine - Ported from the Estimator app
 * Calculates project estimates based on dev hours input
 */

// ============================================
// Types
// ============================================

export interface EstimationConfig {
  percentages: {
    requirements: number;
    technicalDesign: number;
    testing: number;
    support: number;
    devOps: number;
    projectManagement: number;
  };
  devOpsMaxHours: number;
  blendedRate: number;
  roundingThresholds: {
    small: number; // hours threshold - below this round to 4hrs
    large: number; // round to 8hrs for larger projects
  };
  teamSizing: {
    smallProject: { maxWeeks: number; developers: number };
    mediumProject: { maxWeeks: number; developers: number };
    largeProject: { developers: number };
  };
  capacity: {
    maxWeeklyHours: number;
    sprintWeeks: number;
  };
  projectSizeThresholds: {
    micro: { maxHours: number };
    small: { maxHours: number };
    medium: { maxHours: number };
  };
  roleFlexibility: {
    projectManagement: Record<string, { percentage: number; enabled: boolean }>;
    devOps: Record<string, { percentage: number; enabled: boolean }>;
  };
  sprintConsolidation: {
    enabled: boolean;
    thresholdHours: number;
  };
}

export interface PhaseBreakdown {
  requirements: number;
  technicalDesign: number;
  development: number;
  testing: number;
  support: number;
  devOps: number;
  projectManagement: number;
}

export interface EstimationResult {
  phases: PhaseBreakdown;
  totalHours: number;
  durationWeeks: number;
  durationSprints: number;
  teamSize: number;
  testingModel: 'sequential' | 'hybrid' | 'parallel';
  projectSize: 'micro' | 'small' | 'medium' | 'large';
  capex: { total: number; percentage: number; phases: Array<{ phase: string; hours: number; cost: number }> };
  opex: { total: number; percentage: number; phases: Array<{ phase: string; hours: number; cost: number }> };
  totalCost: number;
  costPerSprint: number;
}

export interface AggregateEstimation {
  teams: Array<{
    teamId: string;
    teamName: string;
    devHours: number;
    estimate: EstimationResult;
  }>;
  totals: {
    phases: PhaseBreakdown;
    totalHours: number;
    totalCost: number;
    capexAmount: number;
    opexAmount: number;
    capexPercentage: number;
    opexPercentage: number;
    durationWeeks: number;
    durationSprints: number;
    teamSize: number;
    testingModel: 'sequential' | 'hybrid' | 'parallel';
  };
}

// ============================================
// Default Config
// ============================================

export const DEFAULT_ESTIMATION_CONFIG: EstimationConfig = {
  percentages: {
    requirements: 5,
    technicalDesign: 5,
    testing: 33,
    support: 10,
    devOps: 5,
    projectManagement: 10,
  },
  devOpsMaxHours: 40,
  blendedRate: 95,
  roundingThresholds: {
    small: 160,
    large: 4,
  },
  teamSizing: {
    smallProject: { maxWeeks: 8, developers: 1 },
    mediumProject: { maxWeeks: 20, developers: 2.5 },
    largeProject: { developers: 3.5 },
  },
  capacity: {
    maxWeeklyHours: 30,
    sprintWeeks: 2,
  },
  projectSizeThresholds: {
    micro: { maxHours: 80 },
    small: { maxHours: 240 },
    medium: { maxHours: 600 },
  },
  roleFlexibility: {
    projectManagement: {
      micro: { percentage: 0, enabled: false },
      small: { percentage: 5, enabled: true },
      medium: { percentage: 10, enabled: true },
      large: { percentage: 12, enabled: true },
    },
    devOps: {
      micro: { percentage: 0, enabled: false },
      small: { percentage: 2, enabled: true },
      medium: { percentage: 6, enabled: true },
      large: { percentage: 8, enabled: true },
    },
  },
  sprintConsolidation: {
    enabled: true,
    thresholdHours: 60,
  },
};

// ============================================
// Helpers
// ============================================

function getProjectSize(
  devHours: number,
  thresholds: EstimationConfig['projectSizeThresholds']
): 'micro' | 'small' | 'medium' | 'large' {
  if (devHours <= thresholds.micro.maxHours) return 'micro';
  if (devHours <= thresholds.small.maxHours) return 'small';
  if (devHours <= thresholds.medium.maxHours) return 'medium';
  return 'large';
}

function getDynamicPercentage(
  role: 'projectManagement' | 'devOps',
  size: string,
  config: EstimationConfig
): number {
  const roleConfig = config.roleFlexibility[role][size];
  if (!roleConfig?.enabled) return 0;
  return roleConfig.percentage;
}

function roundHours(hours: number, totalDevHours: number, config: EstimationConfig): number {
  if (hours <= 0) return 0;
  const roundTo = totalDevHours <= config.roundingThresholds.small ? 4 : 8;
  return Math.ceil(hours / roundTo) * roundTo;
}

function getTestingModel(devHours: number): 'sequential' | 'hybrid' | 'parallel' {
  if (devHours <= 160) return 'sequential';
  if (devHours <= 400) return 'hybrid';
  return 'parallel';
}

// ============================================
// Main Calculation
// ============================================

export function calculateProjectEstimate(
  devHours: number,
  config: EstimationConfig = DEFAULT_ESTIMATION_CONFIG
): EstimationResult {
  if (devHours <= 0) {
    return {
      phases: { requirements: 0, technicalDesign: 0, development: 0, testing: 0, support: 0, devOps: 0, projectManagement: 0 },
      totalHours: 0, durationWeeks: 0, durationSprints: 0, teamSize: 0,
      testingModel: 'sequential', projectSize: 'micro',
      capex: { total: 0, percentage: 0, phases: [] },
      opex: { total: 0, percentage: 0, phases: [] },
      totalCost: 0, costPerSprint: 0,
    };
  }

  const projectSize = getProjectSize(devHours, config.projectSizeThresholds);

  // Calculate phase hours
  const requirements = roundHours(devHours * (config.percentages.requirements / 100), devHours, config);
  const technicalDesign = roundHours(devHours * (config.percentages.technicalDesign / 100), devHours, config);
  const development = roundHours(devHours, devHours, config);
  const testing = roundHours(devHours * (config.percentages.testing / 100), devHours, config);
  const support = roundHours(devHours * (config.percentages.support / 100), devHours, config);

  // Dynamic PM and DevOps based on project size
  const pmPct = getDynamicPercentage('projectManagement', projectSize, config);
  const devOpsPct = getDynamicPercentage('devOps', projectSize, config);

  let projectManagement = roundHours(devHours * (pmPct / 100), devHours, config);
  let devOps = roundHours(devHours * (devOpsPct / 100), devHours, config);

  // DevOps max cap
  if (devOps > config.devOpsMaxHours) {
    devOps = config.devOpsMaxHours;
  }

  const phases: PhaseBreakdown = {
    requirements,
    technicalDesign,
    development,
    testing,
    support,
    devOps,
    projectManagement,
  };

  const totalHours = requirements + technicalDesign + development + testing + support + devOps + projectManagement;

  // Team sizing
  let teamSize: number;
  const rawWeeks = totalHours / config.capacity.maxWeeklyHours;
  if (rawWeeks <= config.teamSizing.smallProject.maxWeeks) {
    teamSize = config.teamSizing.smallProject.developers;
  } else if (rawWeeks <= config.teamSizing.mediumProject.maxWeeks) {
    teamSize = config.teamSizing.mediumProject.developers;
  } else {
    teamSize = config.teamSizing.largeProject.developers;
  }

  // Duration calculation
  const durationWeeks = Math.ceil(totalHours / (teamSize * config.capacity.maxWeeklyHours));
  const sprintWeeks = config.capacity.sprintWeeks;
  const durationSprints = Math.ceil(durationWeeks / sprintWeeks);
  const adjustedWeeks = durationSprints * sprintWeeks; // Round to sprint boundary

  const testingModel = getTestingModel(devHours);
  const blendedRate = config.blendedRate;

  // CapEx/OpEx split
  // OpEx: Requirements + PM
  // CapEx: everything else
  const opexPhases: Array<{ phase: string; hours: number; cost: number }> = [];
  const capexPhases: Array<{ phase: string; hours: number; cost: number }> = [];

  const phaseCategories: Array<{ key: keyof PhaseBreakdown; label: string; type: 'opex' | 'capex' }> = [
    { key: 'requirements', label: 'Requirements', type: 'opex' },
    { key: 'technicalDesign', label: 'Technical Design', type: 'capex' },
    { key: 'development', label: 'Development', type: 'capex' },
    { key: 'testing', label: 'Testing', type: 'capex' },
    { key: 'support', label: 'Hypercare Support', type: 'capex' },
    { key: 'devOps', label: 'DevOps', type: 'capex' },
    { key: 'projectManagement', label: 'Project Management', type: 'opex' },
  ];

  let opexTotal = 0;
  let capexTotal = 0;

  for (const pc of phaseCategories) {
    const hours = phases[pc.key];
    if (hours <= 0) continue;
    const cost = hours * blendedRate;
    const entry = { phase: pc.label, hours, cost };
    if (pc.type === 'opex') {
      opexPhases.push(entry);
      opexTotal += cost;
    } else {
      capexPhases.push(entry);
      capexTotal += cost;
    }
  }

  const totalCost = opexTotal + capexTotal;
  const costPerSprint = durationSprints > 0 ? totalCost / durationSprints : 0;

  return {
    phases,
    totalHours,
    durationWeeks: adjustedWeeks,
    durationSprints,
    teamSize,
    testingModel,
    projectSize,
    capex: {
      total: capexTotal,
      percentage: totalCost > 0 ? (capexTotal / totalCost) * 100 : 0,
      phases: capexPhases,
    },
    opex: {
      total: opexTotal,
      percentage: totalCost > 0 ? (opexTotal / totalCost) * 100 : 0,
      phases: opexPhases,
    },
    totalCost,
    costPerSprint,
  };
}

// ============================================
// Aggregate Estimation (across teams)
// ============================================

export function calculateAggregateEstimate(
  teamEstimates: Array<{ teamId: string; teamName: string; devHours: number }>,
  config: EstimationConfig = DEFAULT_ESTIMATION_CONFIG
): AggregateEstimation {
  const teams = teamEstimates.map((te) => ({
    teamId: te.teamId,
    teamName: te.teamName,
    devHours: te.devHours,
    estimate: calculateProjectEstimate(te.devHours, config),
  }));

  // Aggregate totals
  const totalPhases: PhaseBreakdown = {
    requirements: 0, technicalDesign: 0, development: 0,
    testing: 0, support: 0, devOps: 0, projectManagement: 0,
  };

  let totalHours = 0;
  let totalCost = 0;
  let capexAmount = 0;
  let opexAmount = 0;
  let maxWeeks = 0;
  let totalDevHours = 0;

  for (const t of teams) {
    const e = t.estimate;
    totalPhases.requirements += e.phases.requirements;
    totalPhases.technicalDesign += e.phases.technicalDesign;
    totalPhases.development += e.phases.development;
    totalPhases.testing += e.phases.testing;
    totalPhases.support += e.phases.support;
    totalPhases.devOps += e.phases.devOps;
    totalPhases.projectManagement += e.phases.projectManagement;
    totalHours += e.totalHours;
    totalCost += e.totalCost;
    capexAmount += e.capex.total;
    opexAmount += e.opex.total;
    if (e.durationWeeks > maxWeeks) maxWeeks = e.durationWeeks;
    totalDevHours += t.devHours;
  }

  const sprintWeeks = config.capacity.sprintWeeks;
  const durationSprints = Math.ceil(maxWeeks / sprintWeeks);
  const adjustedWeeks = durationSprints * sprintWeeks;

  // Aggregate team size and testing model from total dev hours
  const aggregateEstimate = calculateProjectEstimate(totalDevHours, config);

  return {
    teams,
    totals: {
      phases: totalPhases,
      totalHours,
      totalCost,
      capexAmount,
      opexAmount,
      capexPercentage: totalCost > 0 ? (capexAmount / totalCost) * 100 : 0,
      opexPercentage: totalCost > 0 ? (opexAmount / totalCost) * 100 : 0,
      durationWeeks: adjustedWeeks,
      durationSprints,
      teamSize: aggregateEstimate.teamSize,
      testingModel: aggregateEstimate.testingModel,
    },
  };
}

// ============================================
// Config Merge Helper
// ============================================

export function mergeEstimationConfig(
  orgConfig: Record<string, unknown>,
  projectConfig: Record<string, unknown>
): EstimationConfig {
  const base = { ...DEFAULT_ESTIMATION_CONFIG };
  const defaultPercentages = { ...DEFAULT_ESTIMATION_CONFIG.percentages };

  // Deep merge org config
  if (orgConfig && typeof orgConfig === 'object') {
    const { percentages: orgPct, ...orgRest } = orgConfig;
    Object.assign(base, orgRest);
    if (orgPct && typeof orgPct === 'object') {
      base.percentages = { ...defaultPercentages, ...(orgPct as Record<string, number>) };
    } else {
      base.percentages = { ...defaultPercentages };
    }
  }

  // Deep merge project config (overrides org)
  if (projectConfig && typeof projectConfig === 'object') {
    const { percentages: projPct, ...projRest } = projectConfig;
    Object.assign(base, projRest);
    if (projPct && typeof projPct === 'object') {
      base.percentages = { ...base.percentages, ...(projPct as Record<string, number>) };
    }
  }

  return base;
}
