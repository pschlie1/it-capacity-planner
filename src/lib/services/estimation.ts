// Estimation Engine - ported from Estimator app
// Calculates project hours, costs, timeline from dev hours input

export interface EstimationConfig {
  percentages: {
    requirements: number;
    technicalDesign: number;
    testing: number;
    support: number;
    devOps: number;
    projectManagement: number;
  };
  blendedRate: number;
  devOpsMaxHours: number;
  capacity: {
    maxWeeklyHours: number;
    sprintWeeks: number;
  };
  teamSizing: {
    smallProject: { maxWeeks: number; developers: number };
    mediumProject: { maxWeeks: number; developers: number };
    largeProject: { developers: number };
  };
  projectSizeThresholds: {
    micro: number;
    small: number;
    medium: number;
  };
  roleFlexibility: {
    projectManagement: Record<string, { percentage: number; enabled: boolean }>;
    devOps: Record<string, { percentage: number; enabled: boolean }>;
  };
  sprintConsolidation: {
    enabled: boolean;
    thresholdHours: number;
  };
  roundingThresholds: {
    small: number;
  };
}

export const DEFAULT_ESTIMATION_CONFIG: EstimationConfig = {
  percentages: {
    requirements: 5,
    technicalDesign: 5,
    testing: 33,
    support: 10,
    devOps: 5,
    projectManagement: 10,
  },
  blendedRate: 95,
  devOpsMaxHours: 40,
  capacity: {
    maxWeeklyHours: 30,
    sprintWeeks: 2,
  },
  teamSizing: {
    smallProject: { maxWeeks: 8, developers: 1 },
    mediumProject: { maxWeeks: 20, developers: 2.5 },
    largeProject: { developers: 3.5 },
  },
  projectSizeThresholds: {
    micro: 80,
    small: 240,
    medium: 600,
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
  roundingThresholds: {
    small: 160,
  },
};

export type ProjectSizeCategory = 'micro' | 'small' | 'medium' | 'large';
export type TestingModelType = 'sequential' | 'hybrid' | 'parallel';

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
  totalCost: number;
  capexAmount: number;
  opexAmount: number;
  capexPercent: number;
  opexPercent: number;
  teamSize: number;
  teamSizeExact: number;
  projectSizeCategory: ProjectSizeCategory;
  projectSizeLabel: string;
  testingModel: TestingModelType;
  estimatedWeeks: number;
  devWeeks: number;
  sprintConsolidated: boolean;
  phaseDetails: PhaseDetail[];
}

export interface PhaseDetail {
  name: string;
  key: string;
  hours: number;
  cost: number;
  category: 'CapEx' | 'OpEx';
  weeks: number;
}

export interface AggregateEstimation {
  teams: Array<{
    teamId: string;
    teamName: string;
    devHours: number;
    result: EstimationResult;
  }>;
  totalDevHours: number;
  totalHours: number;
  totalCost: number;
  totalCapex: number;
  totalOpex: number;
  estimatedWeeks: number;
  recommendedTeamSize: number;
}

// ---- Core Functions ----

function getProjectSizeCategory(
  devHours: number,
  thresholds: EstimationConfig['projectSizeThresholds']
): ProjectSizeCategory {
  if (devHours <= thresholds.micro) return 'micro';
  if (devHours <= thresholds.small) return 'small';
  if (devHours <= thresholds.medium) return 'medium';
  return 'large';
}

function getProjectSizeLabel(category: ProjectSizeCategory): string {
  const labels: Record<ProjectSizeCategory, string> = {
    micro: 'Micro Project',
    small: 'Small Project',
    medium: 'Medium Project',
    large: 'Large Project',
  };
  return labels[category];
}

function roundToNearest(hours: number, isSmallProject: boolean): number {
  const roundTo = isSmallProject ? 4 : 8;
  return Math.ceil(hours / roundTo) * roundTo;
}

function roundToSprintBoundary(weeks: number, sprintWeeks: number): number {
  return Math.ceil(weeks / sprintWeeks) * sprintWeeks;
}

function getDynamicPercentage(
  role: 'projectManagement' | 'devOps',
  category: ProjectSizeCategory,
  config: EstimationConfig
): number {
  const roleConfig = config.roleFlexibility[role][category];
  if (!roleConfig || !roleConfig.enabled) return 0;
  return roleConfig.percentage;
}

function calculateOptimalTeamSize(
  devHours: number,
  config: EstimationConfig
): { exact: number; rounded: number } {
  const singleDevWeeks = devHours / config.capacity.maxWeeklyHours;

  let exact: number;
  if (singleDevWeeks <= config.teamSizing.smallProject.maxWeeks) {
    exact = config.teamSizing.smallProject.developers;
  } else if (singleDevWeeks <= config.teamSizing.mediumProject.maxWeeks) {
    exact = config.teamSizing.mediumProject.developers;
  } else {
    exact = config.teamSizing.largeProject.developers;
  }

  return { exact, rounded: Math.round(exact) || 1 };
}

function getTestingModel(
  teamSize: number,
  devWeeks: number
): TestingModelType {
  if (teamSize === 1 && devWeeks <= 8) return 'sequential';
  if (teamSize <= 3) return 'hybrid';
  return 'parallel';
}

// ---- Main Calculation ----

export function calculateProjectEstimate(
  devHours: number,
  configOverrides?: Partial<EstimationConfig>
): EstimationResult {
  const config: EstimationConfig = {
    ...DEFAULT_ESTIMATION_CONFIG,
    ...configOverrides,
    percentages: {
      ...DEFAULT_ESTIMATION_CONFIG.percentages,
      ...configOverrides?.percentages,
    },
    capacity: {
      ...DEFAULT_ESTIMATION_CONFIG.capacity,
      ...configOverrides?.capacity,
    },
    teamSizing: {
      ...DEFAULT_ESTIMATION_CONFIG.teamSizing,
      ...configOverrides?.teamSizing,
    },
    projectSizeThresholds: {
      ...DEFAULT_ESTIMATION_CONFIG.projectSizeThresholds,
      ...configOverrides?.projectSizeThresholds,
    },
    roleFlexibility: {
      ...DEFAULT_ESTIMATION_CONFIG.roleFlexibility,
      ...configOverrides?.roleFlexibility,
    },
    sprintConsolidation: {
      ...DEFAULT_ESTIMATION_CONFIG.sprintConsolidation,
      ...configOverrides?.sprintConsolidation,
    },
    roundingThresholds: {
      ...DEFAULT_ESTIMATION_CONFIG.roundingThresholds,
      ...configOverrides?.roundingThresholds,
    },
  };

  if (devHours <= 0) {
    return emptyResult();
  }

  const isSmall = devHours <= config.roundingThresholds.small;
  const sizeCategory = getProjectSizeCategory(devHours, config.projectSizeThresholds);
  const sizeLabel = getProjectSizeLabel(sizeCategory);

  // Calculate phase hours
  const requirementsHours = roundToNearest(devHours * (config.percentages.requirements / 100), isSmall);
  const technicalDesignHours = roundToNearest(devHours * (config.percentages.technicalDesign / 100), isSmall);
  const testingHours = roundToNearest(devHours * (config.percentages.testing / 100), isSmall);
  const supportHours = roundToNearest(devHours * (config.percentages.support / 100), isSmall);

  const devOpsPct = getDynamicPercentage('devOps', sizeCategory, config);
  const pmPct = getDynamicPercentage('projectManagement', sizeCategory, config);

  const devOpsHours = Math.min(
    roundToNearest(devHours * (devOpsPct / 100), isSmall),
    config.devOpsMaxHours
  );
  const pmHours = roundToNearest(devHours * (pmPct / 100), isSmall);

  // Team sizing
  const { exact: teamSizeExact, rounded: teamSize } = calculateOptimalTeamSize(devHours, config);

  // Development duration
  const rawDevWeeks = devHours / (teamSizeExact * config.capacity.maxWeeklyHours);
  const devWeeks = roundToSprintBoundary(rawDevWeeks, config.capacity.sprintWeeks);

  // Testing model
  const testModel = getTestingModel(teamSize, devWeeks);

  // Sprint consolidation
  const consolidated = config.sprintConsolidation.enabled &&
    (requirementsHours + technicalDesignHours) <= config.sprintConsolidation.thresholdHours;

  // Estimate total weeks
  const reqDesignWeeks = consolidated
    ? roundToSprintBoundary(
        Math.ceil((requirementsHours + technicalDesignHours) / 8) / 5,
        config.capacity.sprintWeeks
      )
    : roundToSprintBoundary(Math.ceil(requirementsHours / 8) / 5, config.capacity.sprintWeeks) +
      roundToSprintBoundary(Math.ceil(technicalDesignHours / 8) / 5, config.capacity.sprintWeeks);

  let testingWeeks = 0;
  if (testModel === 'sequential') {
    testingWeeks = roundToSprintBoundary(Math.ceil(testingHours / 8) / 5, config.capacity.sprintWeeks);
  } else if (testModel === 'hybrid') {
    testingWeeks = 2; // UAT period beyond dev
  } else {
    testingWeeks = 2; // UAT period beyond dev
  }

  const supportWeeks = roundToSprintBoundary(
    Math.ceil(supportHours / 8) / 5,
    config.capacity.sprintWeeks
  );

  const totalWeeks = reqDesignWeeks + devWeeks + testingWeeks + supportWeeks;

  // Totals
  const phases: PhaseBreakdown = {
    requirements: requirementsHours,
    technicalDesign: technicalDesignHours,
    development: devHours,
    testing: testingHours,
    support: supportHours,
    devOps: devOpsHours,
    projectManagement: pmHours,
  };

  const totalHours = Object.values(phases).reduce((sum, h) => sum + h, 0);
  const totalCost = totalHours * config.blendedRate;

  // CapEx/OpEx (Requirements + PM = OpEx, rest = CapEx)
  const opexAmount = (requirementsHours + pmHours) * config.blendedRate;
  const capexAmount = totalCost - opexAmount;

  const phaseDetails: PhaseDetail[] = [
    { name: 'Requirements', key: 'requirements', hours: requirementsHours, cost: requirementsHours * config.blendedRate, category: 'OpEx', weeks: reqDesignWeeks },
    { name: 'Technical Design', key: 'technicalDesign', hours: technicalDesignHours, cost: technicalDesignHours * config.blendedRate, category: 'CapEx', weeks: consolidated ? 0 : reqDesignWeeks },
    { name: 'Development', key: 'development', hours: devHours, cost: devHours * config.blendedRate, category: 'CapEx', weeks: devWeeks },
    { name: 'Testing', key: 'testing', hours: testingHours, cost: testingHours * config.blendedRate, category: 'CapEx', weeks: testingWeeks },
    { name: 'Post-Deploy Support', key: 'support', hours: supportHours, cost: supportHours * config.blendedRate, category: 'CapEx', weeks: supportWeeks },
    { name: 'DevOps', key: 'devOps', hours: devOpsHours, cost: devOpsHours * config.blendedRate, category: 'CapEx', weeks: 0 },
    { name: 'Project Management', key: 'projectManagement', hours: pmHours, cost: pmHours * config.blendedRate, category: 'OpEx', weeks: 0 },
  ];

  return {
    phases,
    totalHours,
    totalCost,
    capexAmount,
    opexAmount,
    capexPercent: totalCost > 0 ? (capexAmount / totalCost) * 100 : 0,
    opexPercent: totalCost > 0 ? (opexAmount / totalCost) * 100 : 0,
    teamSize,
    teamSizeExact,
    projectSizeCategory: sizeCategory,
    projectSizeLabel: sizeLabel,
    testingModel: testModel,
    estimatedWeeks: totalWeeks,
    devWeeks,
    sprintConsolidated: consolidated,
    phaseDetails,
  };
}

export function calculateAggregateEstimate(
  teamEstimates: Array<{ teamId: string; teamName: string; devHours: number }>,
  configOverrides?: Partial<EstimationConfig>
): AggregateEstimation {
  const teams = teamEstimates
    .filter((t) => t.devHours > 0)
    .map((t) => ({
      teamId: t.teamId,
      teamName: t.teamName,
      devHours: t.devHours,
      result: calculateProjectEstimate(t.devHours, configOverrides),
    }));

  const totalDevHours = teams.reduce((s, t) => s + t.devHours, 0);
  const totalHours = teams.reduce((s, t) => s + t.result.totalHours, 0);
  const totalCost = teams.reduce((s, t) => s + t.result.totalCost, 0);
  const totalCapex = teams.reduce((s, t) => s + t.result.capexAmount, 0);
  const totalOpex = teams.reduce((s, t) => s + t.result.opexAmount, 0);
  const estimatedWeeks = teams.length > 0 ? Math.max(...teams.map((t) => t.result.estimatedWeeks)) : 0;
  const recommendedTeamSize = teams.reduce((s, t) => s + t.result.teamSize, 0);

  return {
    teams,
    totalDevHours,
    totalHours,
    totalCost,
    totalCapex,
    totalOpex,
    estimatedWeeks,
    recommendedTeamSize,
  };
}

function emptyResult(): EstimationResult {
  return {
    phases: { requirements: 0, technicalDesign: 0, development: 0, testing: 0, support: 0, devOps: 0, projectManagement: 0 },
    totalHours: 0,
    totalCost: 0,
    capexAmount: 0,
    opexAmount: 0,
    capexPercent: 0,
    opexPercent: 0,
    teamSize: 0,
    teamSizeExact: 0,
    projectSizeCategory: 'micro',
    projectSizeLabel: 'No Estimate',
    testingModel: 'sequential',
    estimatedWeeks: 0,
    devWeeks: 0,
    sprintConsolidated: false,
    phaseDetails: [],
  };
}
