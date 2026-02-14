import { describe, it, expect } from 'vitest';
import {
  calculateProjectEstimate,
  calculateAggregateEstimate,
  mergeEstimationConfig,
  DEFAULT_ESTIMATION_CONFIG,
} from '../services/estimation';

/**
 * E2E-style integration tests for the full estimation workflow:
 * 1. Configure estimation → 2. Calculate per-team → 3. Aggregate → 4. Verify financials
 */

describe('Estimation Workflow Integration', () => {
  it('full workflow: multi-team project with custom config', () => {
    // Step 1: Org config with custom rate
    const orgConfig = { blendedRate: 120, percentages: { testing: 40 } };
    const projectConfig = {};
    const config = mergeEstimationConfig(orgConfig, projectConfig);

    expect(config.blendedRate).toBe(120);
    expect(config.percentages.testing).toBe(40);
    expect(config.percentages.requirements).toBe(5); // default preserved

    // Step 2: Calculate per-team estimates
    const teams = [
      { teamId: 't1', teamName: 'Frontend', devHours: 300 },
      { teamId: 't2', teamName: 'Backend', devHours: 500 },
      { teamId: 't3', teamName: 'Mobile', devHours: 200 },
    ];

    // Step 3: Aggregate
    const result = calculateAggregateEstimate(teams, config);

    // Step 4: Verify
    expect(result.teams).toHaveLength(3);
    expect(result.totals.totalHours).toBeGreaterThan(1000);
    expect(result.totals.totalCost).toBe(result.totals.totalHours * 120);
    expect(result.totals.capexAmount + result.totals.opexAmount).toBeCloseTo(result.totals.totalCost);
    expect(result.totals.durationWeeks % 2).toBe(0); // sprint-aligned
    expect(result.totals.durationSprints).toBe(result.totals.durationWeeks / 2);

    // Backend team should have more hours than Frontend
    const backendEst = result.teams.find(t => t.teamId === 't2')!;
    const frontendEst = result.teams.find(t => t.teamId === 't1')!;
    expect(backendEst.estimate.totalHours).toBeGreaterThan(frontendEst.estimate.totalHours);
  });

  it('full workflow: project config overrides org config', () => {
    const orgConfig = { blendedRate: 100 };
    const projectConfig = { blendedRate: 150, percentages: { testing: 50 } };
    const config = mergeEstimationConfig(orgConfig, projectConfig);

    expect(config.blendedRate).toBe(150); // project overrides org

    const teams = [
      { teamId: 't1', teamName: 'Core', devHours: 400 },
    ];
    const result = calculateAggregateEstimate(teams, config);

    // Testing at 50% of 400 = 200hrs
    expect(result.teams[0].estimate.phases.testing).toBe(200);
    // Cost should use 150 rate
    expect(result.totals.totalCost).toBe(result.totals.totalHours * 150);
  });

  it('project size affects PM and DevOps allocation', () => {
    const micro = calculateProjectEstimate(50);
    const small = calculateProjectEstimate(200);
    const medium = calculateProjectEstimate(400);
    const large = calculateProjectEstimate(800);

    // Micro: no PM or DevOps
    expect(micro.phases.projectManagement).toBe(0);
    expect(micro.phases.devOps).toBe(0);

    // Small: low PM and DevOps
    expect(small.phases.projectManagement).toBeGreaterThan(0);
    expect(small.phases.devOps).toBeGreaterThan(0);

    // Medium > Small in PM
    expect(medium.phases.projectManagement).toBeGreaterThan(small.phases.projectManagement);

    // Large: highest PM, DevOps capped at 40
    expect(large.phases.projectManagement).toBeGreaterThan(medium.phases.projectManagement);
    expect(large.phases.devOps).toBeLessThanOrEqual(40);
  });
});
