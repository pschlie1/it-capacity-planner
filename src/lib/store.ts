// In-memory data store for Vercel deployment (no persistent DB needed for demo)
import { v4 as uuid } from 'uuid';

export interface Team {
  id: string; name: string;
  pmFte: number; productManagerFte: number; uxDesignerFte: number | null;
  businessAnalystFte: number; scrumMasterFte: number; architectFte: number;
  developerFte: number; qaFte: number; devopsFte: number; dbaFte: number;
  kloTlmHoursPerWeek: number; adminPct: number;
}

export interface TeamEstimate {
  id: string; projectId: string; teamId: string;
  design: number; development: number; testing: number; deployment: number; postDeploy: number;
}

export interface Project {
  id: string; name: string; priority: number; status: string;
  description: string; startWeekOffset: number;
}

export interface Scenario {
  id: string; name: string; locked: boolean;
}

export interface PriorityOverride {
  id: string; scenarioId: string; projectId: string; priority: number;
}

export interface Contractor {
  id: string; scenarioId: string; teamId: string; roleKey: string;
  fte: number; weeks: number; label: string; startWeek: number;
}

// Initialize seed data
function createSeedData() {
  const web: Team = { id: uuid(), name: 'Web Development', pmFte: 0, productManagerFte: 0.5, uxDesignerFte: null, businessAnalystFte: 0.5, scrumMasterFte: 0, architectFte: 0.5, developerFte: 3.0, qaFte: 1.0, devopsFte: 0.5, dbaFte: 0, kloTlmHoursPerWeek: 15, adminPct: 25 };
  const bizapps: Team = { id: uuid(), name: 'BizApps', pmFte: 0.5, productManagerFte: 0, uxDesignerFte: null, businessAnalystFte: 1.0, scrumMasterFte: 0, architectFte: 0.5, developerFte: 2.5, qaFte: 1.0, devopsFte: 0.5, dbaFte: 0, kloTlmHoursPerWeek: 20, adminPct: 25 };
  const erp: Team = { id: uuid(), name: 'ERP', pmFte: 0.5, productManagerFte: 0, uxDesignerFte: null, businessAnalystFte: 1.0, scrumMasterFte: 0, architectFte: 1.0, developerFte: 4.0, qaFte: 1.5, devopsFte: 1.0, dbaFte: 0.5, kloTlmHoursPerWeek: 30, adminPct: 20 };
  const data: Team = { id: uuid(), name: 'Data & Analytics', pmFte: 0, productManagerFte: 0, uxDesignerFte: null, businessAnalystFte: 0.5, scrumMasterFte: 0, architectFte: 0.5, developerFte: 2.0, qaFte: 0.5, devopsFte: 0.5, dbaFte: 1.0, kloTlmHoursPerWeek: 12, adminPct: 25 };
  const infraops: Team = { id: uuid(), name: 'InfraOps', pmFte: 0, productManagerFte: 0, uxDesignerFte: null, businessAnalystFte: 0, scrumMasterFte: 0, architectFte: 0.5, developerFte: 1.5, qaFte: 0.5, devopsFte: 2.0, dbaFte: 0, kloTlmHoursPerWeek: 40, adminPct: 20 };
  const security: Team = { id: uuid(), name: 'Security', pmFte: 0, productManagerFte: 0, uxDesignerFte: null, businessAnalystFte: 0, scrumMasterFte: 0, architectFte: 0.5, developerFte: 1.0, qaFte: 0.5, devopsFte: 0.5, dbaFte: 0, kloTlmHoursPerWeek: 15, adminPct: 25 };

  const teams = [web, bizapps, erp, data, infraops, security];

  const projectDefs = [
    { name: 'Customer Portal Redesign', priority: 1, status: 'active', description: 'Complete overhaul of customer-facing portal with modern UX, SSO integration, and self-service capabilities.' },
    { name: 'ERP Cloud Migration', priority: 2, status: 'proposed', description: 'Migrate on-premise ERP system to cloud infrastructure with zero downtime.' },
    { name: 'Data Warehouse Modernization', priority: 3, status: 'proposed', description: 'Replace legacy data warehouse with modern lakehouse architecture for real-time analytics.' },
    { name: 'Zero Trust Security', priority: 4, status: 'proposed', description: 'Implement zero trust network architecture across all IT systems.' },
    { name: 'Mobile App Platform', priority: 5, status: 'proposed', description: 'Build cross-platform mobile application framework for internal and external apps.' },
    { name: 'API Gateway & Microservices', priority: 6, status: 'proposed', description: 'Deploy enterprise API gateway and begin decomposing monolithic services.' },
    { name: 'AI/ML Operations Platform', priority: 7, status: 'proposed', description: 'Stand up MLOps infrastructure for model training, deployment, and monitoring.' },
    { name: 'Legacy System Decommission', priority: 8, status: 'proposed', description: 'Retire 3 legacy applications and migrate remaining users to modern alternatives.' },
    { name: 'Compliance Automation', priority: 9, status: 'proposed', description: 'Automate SOX and SOC2 compliance reporting and evidence collection.' },
    { name: 'Employee Experience Portal', priority: 10, status: 'proposed', description: 'Unified internal portal for HR, IT requests, knowledge base, and onboarding.' },
  ];

  const projects: Project[] = projectDefs.map(p => ({ id: uuid(), ...p, startWeekOffset: 0 }));

  const estimateDefs = [
    { pi: 0, tid: web.id, design: 80, development: 320, testing: 120, deployment: 24, postDeploy: 40 },
    { pi: 0, tid: security.id, design: 16, development: 40, testing: 24, deployment: 8, postDeploy: 8 },
    { pi: 1, tid: erp.id, design: 120, development: 480, testing: 200, deployment: 80, postDeploy: 120 },
    { pi: 1, tid: infraops.id, design: 40, development: 160, testing: 60, deployment: 40, postDeploy: 40 },
    { pi: 1, tid: security.id, design: 24, development: 40, testing: 32, deployment: 16, postDeploy: 16 },
    { pi: 2, tid: data.id, design: 80, development: 280, testing: 100, deployment: 40, postDeploy: 60 },
    { pi: 2, tid: infraops.id, design: 24, development: 80, testing: 24, deployment: 24, postDeploy: 16 },
    { pi: 3, tid: security.id, design: 60, development: 120, testing: 80, deployment: 40, postDeploy: 40 },
    { pi: 3, tid: infraops.id, design: 40, development: 120, testing: 40, deployment: 32, postDeploy: 24 },
    { pi: 4, tid: web.id, design: 60, development: 240, testing: 100, deployment: 24, postDeploy: 40 },
    { pi: 4, tid: bizapps.id, design: 40, development: 160, testing: 60, deployment: 16, postDeploy: 24 },
    { pi: 5, tid: web.id, design: 40, development: 160, testing: 60, deployment: 24, postDeploy: 24 },
    { pi: 5, tid: bizapps.id, design: 24, development: 120, testing: 40, deployment: 16, postDeploy: 16 },
    { pi: 5, tid: infraops.id, design: 24, development: 80, testing: 24, deployment: 16, postDeploy: 8 },
    { pi: 6, tid: data.id, design: 60, development: 200, testing: 80, deployment: 32, postDeploy: 40 },
    { pi: 6, tid: infraops.id, design: 16, development: 60, testing: 16, deployment: 16, postDeploy: 8 },
    { pi: 7, tid: bizapps.id, design: 24, development: 120, testing: 60, deployment: 24, postDeploy: 40 },
    { pi: 7, tid: erp.id, design: 40, development: 160, testing: 80, deployment: 40, postDeploy: 60 },
    { pi: 8, tid: security.id, design: 32, development: 80, testing: 40, deployment: 16, postDeploy: 16 },
    { pi: 8, tid: bizapps.id, design: 16, development: 60, testing: 24, deployment: 8, postDeploy: 8 },
    { pi: 9, tid: web.id, design: 40, development: 200, testing: 80, deployment: 16, postDeploy: 24 },
    { pi: 9, tid: bizapps.id, design: 24, development: 100, testing: 40, deployment: 16, postDeploy: 16 },
  ];

  const teamEstimates: TeamEstimate[] = estimateDefs.map(e => ({
    id: uuid(), projectId: projects[e.pi].id, teamId: e.tid,
    design: e.design, development: e.development, testing: e.testing,
    deployment: e.deployment, postDeploy: e.postDeploy,
  }));

  const baseScenario: Scenario = { id: uuid(), name: 'Baseline', locked: false };
  const optimisticScenario: Scenario = { id: uuid(), name: 'Optimistic - QA Augmentation', locked: false };

  const scenarios = [baseScenario, optimisticScenario];

  const contractors: Contractor[] = [{
    id: uuid(), scenarioId: optimisticScenario.id, teamId: erp.id,
    roleKey: 'qa', fte: 1.0, weeks: 26, label: 'Contract QA - ERP Migration', startWeek: 4,
  }];

  return { teams, projects, teamEstimates, scenarios, contractors, priorityOverrides: [] as PriorityOverride[] };
}

// Global store
const store = createSeedData();

export function getStore() { return store; }

// Teams
export function getTeams() { return store.teams; }
export function getTeam(id: string) { return store.teams.find(t => t.id === id); }
export function createTeam(data: Omit<Team, 'id'>) {
  const team = { ...data, id: uuid() };
  store.teams.push(team);
  return team;
}
export function updateTeam(id: string, data: Partial<Team>) {
  const idx = store.teams.findIndex(t => t.id === id);
  if (idx >= 0) store.teams[idx] = { ...store.teams[idx], ...data };
  return store.teams[idx];
}
export function deleteTeam(id: string) {
  store.teams.splice(store.teams.findIndex(t => t.id === id), 1);
  store.teamEstimates.splice(0, store.teamEstimates.length, ...store.teamEstimates.filter(te => te.teamId !== id));
}

// Projects
export function getProjects() { return store.projects.sort((a, b) => a.priority - b.priority); }
export function getProject(id: string) { return store.projects.find(p => p.id === id); }
export function createProject(data: Omit<Project, 'id'>) {
  const project = { ...data, id: uuid() };
  store.projects.push(project);
  return project;
}
export function updateProject(id: string, data: Partial<Project>) {
  const idx = store.projects.findIndex(p => p.id === id);
  if (idx >= 0) store.projects[idx] = { ...store.projects[idx], ...data };
  return store.projects[idx];
}
export function deleteProject(id: string) {
  store.projects.splice(store.projects.findIndex(p => p.id === id), 1);
  store.teamEstimates.splice(0, store.teamEstimates.length, ...store.teamEstimates.filter(te => te.projectId !== id));
}

// Team Estimates
export function getTeamEstimates(projectId?: string) {
  return projectId ? store.teamEstimates.filter(te => te.projectId === projectId) : store.teamEstimates;
}
export function setTeamEstimates(projectId: string, estimates: Omit<TeamEstimate, 'id' | 'projectId'>[]) {
  store.teamEstimates.splice(0, store.teamEstimates.length, ...store.teamEstimates.filter(te => te.projectId !== projectId));
  for (const e of estimates) {
    store.teamEstimates.push({ ...e, id: uuid(), projectId });
  }
}

// Scenarios
export function getScenarios() { return store.scenarios; }
export function getScenario(id: string) { return store.scenarios.find(s => s.id === id); }
export function createScenario(data: { name: string; locked?: boolean }) {
  const scenario: Scenario = { id: uuid(), name: data.name, locked: data.locked || false };
  store.scenarios.push(scenario);
  return scenario;
}
export function updateScenario(id: string, data: Partial<Scenario>) {
  const idx = store.scenarios.findIndex(s => s.id === id);
  if (idx >= 0) store.scenarios[idx] = { ...store.scenarios[idx], ...data };
  return store.scenarios[idx];
}
export function deleteScenario(id: string) {
  store.scenarios.splice(store.scenarios.findIndex(s => s.id === id), 1);
  store.contractors.splice(0, store.contractors.length, ...store.contractors.filter(c => c.scenarioId !== id));
  store.priorityOverrides.splice(0, store.priorityOverrides.length, ...store.priorityOverrides.filter(po => po.scenarioId !== id));
}

// Priority Overrides
export function getPriorityOverrides(scenarioId: string) {
  return store.priorityOverrides.filter(po => po.scenarioId === scenarioId);
}
export function setPriorityOverrides(scenarioId: string, overrides: { projectId: string; priority: number }[]) {
  store.priorityOverrides.splice(0, store.priorityOverrides.length, ...store.priorityOverrides.filter(po => po.scenarioId !== scenarioId));
  for (const o of overrides) {
    store.priorityOverrides.push({ id: uuid(), scenarioId, ...o });
  }
}

// Contractors
export function getContractors(scenarioId?: string) {
  return scenarioId ? store.contractors.filter(c => c.scenarioId === scenarioId) : store.contractors;
}
export function addContractor(data: Omit<Contractor, 'id'>) {
  const contractor = { ...data, id: uuid() };
  store.contractors.push(contractor);
  return contractor;
}
export function removeContractor(id: string) {
  const idx = store.contractors.findIndex(c => c.id === id);
  if (idx >= 0) store.contractors.splice(idx, 1);
}
