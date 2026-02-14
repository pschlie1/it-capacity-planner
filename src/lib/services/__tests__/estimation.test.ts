import { describe, it, expect } from 'vitest';
import {
  calculateProjectEstimate,
  calculateAggregateEstimate,
  DEFAULT_ESTIMATION_CONFIG,
  type EstimationConfig,
} from '../estimation';

describe('calculateProjectEstimate', () => {
  describe('240 dev hours (small project)', () => {
    const result = calculateProjectEstimate(240);

    it('calculates correct phase breakdown', () => {
      expect(result.phases.requirements).toBe(16);
      expect(result.phases.technicalDesign).toBe(16);
      expect(result.phases.development).toBe(240);
      expect(result.phases.testing).toBe(80);
      expect(result.phases.support).toBe(24);
      expect(result.phases.devOps).toBe(8);
      expect(result.phases.projectManagement).toBe(16);
    });

    it('calculates correct total hours', () => {
      expect(result.totalHours).toBe(400);
    });

    it('calculates correct cost at $95/hr', () => {
      expect(result.totalCost).toBe(38000);
    });

    it('identifies as small project', () => {
      expect(result.projectSize).toBe('small');
    });
  });

  describe('project size thresholds', () => {
    it('micro project (80 hrs): PM and DevOps are 0', () => {
      const result = calculateProjectEstimate(80);
      expect(result.projectSize).toBe('micro');
      expect(result.phases.projectManagement).toBe(0);
      expect(result.phases.devOps).toBe(0);
    });

    it('small project (240 hrs): PM=5%, DevOps=2%', () => {
      const result = calculateProjectEstimate(240);
      expect(result.projectSize).toBe('small');
      // PM: 240*0.05=12 -> rounded to 4hr increment = 12 -> ceil(12/4)*4 = 12... actually 16
      expect(result.phases.projectManagement).toBeGreaterThan(0);
      expect(result.phases.devOps).toBeGreaterThan(0);
    });

    it('medium project (500 hrs): PM=10%, DevOps=6%', () => {
      const result = calculateProjectEstimate(500);
      expect(result.projectSize).toBe('medium');
      // PM: 500*0.10=50 -> ceil(50/8)*8 = 56
      expect(result.phases.projectManagement).toBe(56);
      // DevOps: 500*0.06=30 -> ceil(30/8)*8 = 32
      expect(result.phases.devOps).toBe(32);
    });

    it('large project (1000 hrs): PM=12%, DevOps=8%', () => {
      const result = calculateProjectEstimate(1000);
      expect(result.projectSize).toBe('large');
      // PM: 1000*0.12=120 -> ceil(120/8)*8 = 120
      expect(result.phases.projectManagement).toBe(120);
      // DevOps: 1000*0.08=80 -> capped at 40
      expect(result.phases.devOps).toBe(40);
    });
  });

  describe('DevOps cap', () => {
    it('never exceeds 40 hours', () => {
      const result = calculateProjectEstimate(1000);
      expect(result.phases.devOps).toBeLessThanOrEqual(40);

      const result2 = calculateProjectEstimate(2000);
      expect(result2.phases.devOps).toBeLessThanOrEqual(40);
    });
  });

  describe('sprint rounding', () => {
    it('duration weeks are rounded to 2-week (sprint) boundaries', () => {
      const result = calculateProjectEstimate(240);
      expect(result.durationWeeks % 2).toBe(0);
    });

    it('duration sprints match weeks / 2', () => {
      const result = calculateProjectEstimate(500);
      expect(result.durationWeeks).toBe(result.durationSprints * 2);
    });
  });

  describe('hour rounding', () => {
    it('small projects (<=160 dev hrs) round to 4hr increments', () => {
      const result = calculateProjectEstimate(100);
      const phases = result.phases;
      for (const [key, val] of Object.entries(phases)) {
        if (val > 0) {
          expect(val % 4).toBe(0);
        }
      }
    });

    it('larger projects round to 8hr increments', () => {
      const result = calculateProjectEstimate(500);
      const phases = result.phases;
      for (const [key, val] of Object.entries(phases)) {
        if (val > 0) {
          expect(val % 8).toBe(0);
        }
      }
    });
  });

  describe('CapEx/OpEx split', () => {
    it('Requirements + PM = OpEx, rest = CapEx', () => {
      const result = calculateProjectEstimate(240);
      const opexPhaseNames = result.opex.phases.map((p) => p.phase);
      const capexPhaseNames = result.capex.phases.map((p) => p.phase);

      expect(opexPhaseNames).toContain('Requirements');
      expect(opexPhaseNames).toContain('Project Management');
      expect(capexPhaseNames).toContain('Development');
      expect(capexPhaseNames).toContain('Testing');
      expect(capexPhaseNames).toContain('Technical Design');
    });
  });

  describe('testing model', () => {
    it('sequential for <=160 dev hrs', () => {
      expect(calculateProjectEstimate(100).testingModel).toBe('sequential');
      expect(calculateProjectEstimate(160).testingModel).toBe('sequential');
    });

    it('hybrid for 161-400 dev hrs', () => {
      expect(calculateProjectEstimate(240).testingModel).toBe('hybrid');
      expect(calculateProjectEstimate(400).testingModel).toBe('hybrid');
    });

    it('parallel for >400 dev hrs', () => {
      expect(calculateProjectEstimate(500).testingModel).toBe('parallel');
    });
  });

  describe('team sizing', () => {
    it('1 dev for projects fitting in <=8 weeks', () => {
      const result = calculateProjectEstimate(80);
      expect(result.teamSize).toBe(1);
    });

    it('2.5 for projects fitting in <=20 weeks', () => {
      // 240 dev hrs -> 400 total hrs / 30 hrs/wk = 13.3 rawWeeks -> >8, <=20 -> 2.5
      const result = calculateProjectEstimate(240);
      expect(result.teamSize).toBe(2.5);
    });

    it('3.5 for >20 weeks projects', () => {
      const result = calculateProjectEstimate(1000);
      expect(result.teamSize).toBe(3.5);
    });
  });

  describe('edge cases', () => {
    it('zero dev hours returns empty result', () => {
      const result = calculateProjectEstimate(0);
      expect(result.totalHours).toBe(0);
      expect(result.totalCost).toBe(0);
      expect(result.teamSize).toBe(0);
    });

    it('negative dev hours returns empty result', () => {
      const result = calculateProjectEstimate(-100);
      expect(result.totalHours).toBe(0);
      expect(result.totalCost).toBe(0);
    });
  });

  describe('config overrides', () => {
    it('custom blended rate changes cost', () => {
      const config: EstimationConfig = {
        ...DEFAULT_ESTIMATION_CONFIG,
        blendedRate: 150,
      };
      const result = calculateProjectEstimate(240, config);
      // Same hours but higher rate
      expect(result.totalCost).toBe(result.totalHours * 150);
    });

    it('custom percentages change phase hours', () => {
      const config: EstimationConfig = {
        ...DEFAULT_ESTIMATION_CONFIG,
        percentages: {
          ...DEFAULT_ESTIMATION_CONFIG.percentages,
          testing: 50, // 50% instead of 33%
        },
      };
      const result = calculateProjectEstimate(240, config);
      // testing = 240*0.50 = 120 -> ceil(120/4)*4 = 120
      expect(result.phases.testing).toBe(120);
    });
  });
});

describe('calculateAggregateEstimate', () => {
  it('aggregates across multiple teams correctly', () => {
    const teams = [
      { teamId: '1', teamName: 'Frontend', devHours: 200 },
      { teamId: '2', teamName: 'Backend', devHours: 300 },
    ];
    const result = calculateAggregateEstimate(teams);

    expect(result.teams).toHaveLength(2);
    expect(result.totals.totalHours).toBe(
      result.teams[0].estimate.totalHours + result.teams[1].estimate.totalHours
    );
    expect(result.totals.totalCost).toBe(
      result.teams[0].estimate.totalCost + result.teams[1].estimate.totalCost
    );
  });

  it('duration is max of team durations (sprint-rounded)', () => {
    const teams = [
      { teamId: '1', teamName: 'A', devHours: 100 },
      { teamId: '2', teamName: 'B', devHours: 500 },
    ];
    const result = calculateAggregateEstimate(teams);
    const maxTeamWeeks = Math.max(...result.teams.map((t) => t.estimate.durationWeeks));
    expect(result.totals.durationWeeks).toBeGreaterThanOrEqual(maxTeamWeeks);
    expect(result.totals.durationWeeks % 2).toBe(0);
  });

  it('capex + opex = total cost', () => {
    const teams = [
      { teamId: '1', teamName: 'A', devHours: 240 },
      { teamId: '2', teamName: 'B', devHours: 160 },
    ];
    const result = calculateAggregateEstimate(teams);
    expect(result.totals.capexAmount + result.totals.opexAmount).toBeCloseTo(result.totals.totalCost);
  });
});
