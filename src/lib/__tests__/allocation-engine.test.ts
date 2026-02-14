import { describe, it, expect } from 'vitest';
import { runAllocationEngine, TeamData, ProjectData } from '../allocation-engine';

const makeTeam = (overrides: Partial<TeamData> = {}): TeamData => ({
  id: 'team1',
  name: 'Engineering',
  pmFte: 1,
  productManagerFte: 0,
  uxDesignerFte: 0,
  businessAnalystFte: 0,
  scrumMasterFte: 0,
  architectFte: 1,
  developerFte: 4,
  qaFte: 1,
  devopsFte: 1,
  dbaFte: 0,
  kloTlmHoursPerWeek: 0,
  adminPct: 25,
  ...overrides,
});

const makeProject = (overrides: Partial<ProjectData> = {}): ProjectData => ({
  id: 'proj1',
  name: 'Project Alpha',
  priority: 1,
  status: 'active',
  startWeekOffset: 0,
  teamEstimates: [{
    teamId: 'team1',
    design: 40,
    development: 200,
    testing: 80,
    deployment: 20,
    postDeploy: 10,
  }],
  ...overrides,
});

describe('Allocation Engine', () => {
  it('allocates a single project', () => {
    const result = runAllocationEngine([makeTeam()], [makeProject()], [], {});
    expect(result.allocations).toBeDefined();
    expect(result.allocations.length).toBeGreaterThanOrEqual(1);
    expect(result.allocations[0].projectId).toBe('proj1');
  });

  it('respects priority ordering', () => {
    const teams = [makeTeam()];
    const projects = [
      makeProject({ id: 'p1', name: 'P1', priority: 2 }),
      makeProject({ id: 'p2', name: 'P2', priority: 1 }),
    ];
    const result = runAllocationEngine(teams, projects, [], {});
    const p2Idx = result.allocations.findIndex(r => r.projectId === 'p2');
    const p1Idx = result.allocations.findIndex(r => r.projectId === 'p1');
    expect(p2Idx).toBeLessThan(p1Idx);
  });

  it('handles empty inputs', () => {
    const result = runAllocationEngine([], [], [], {});
    expect(result.allocations).toEqual([]);
  });

  it('applies priority overrides', () => {
    const teams = [makeTeam()];
    const projects = [
      makeProject({ id: 'p1', name: 'P1', priority: 1 }),
      makeProject({ id: 'p2', name: 'P2', priority: 2 }),
    ];
    const result = runAllocationEngine(teams, projects, [], { p2: 0 });
    const p2Idx = result.allocations.findIndex(r => r.projectId === 'p2');
    const p1Idx = result.allocations.findIndex(r => r.projectId === 'p1');
    expect(p2Idx).toBeLessThan(p1Idx);
  });

  it('returns team capacities', () => {
    const result = runAllocationEngine([makeTeam()], [makeProject()], [], {});
    expect(result.teamCapacities).toBeDefined();
    expect(result.teamCapacities.length).toBe(1);
  });
});
