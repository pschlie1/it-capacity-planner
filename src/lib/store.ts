// In-memory data store for Vercel deployment
import { v4 as uuid } from 'uuid';

export interface Team {
  id: string; name: string;
  pmFte: number; productManagerFte: number; uxDesignerFte: number | null;
  businessAnalystFte: number; scrumMasterFte: number; architectFte: number;
  developerFte: number; qaFte: number; devopsFte: number; dbaFte: number;
  kloTlmHoursPerWeek: number; adminPct: number;
  skills?: string[]; // e.g. ['React','Python','SAP']
}

export interface TeamEstimate {
  id: string; projectId: string; teamId: string;
  design: number; development: number; testing: number; deployment: number; postDeploy: number;
  // Role-level breakdown per phase
  roleBreakdown?: Record<string, Record<string, number>>; // phase -> role -> hours
  confidence?: 'high' | 'medium' | 'low';
}

export interface Project {
  id: string; name: string; priority: number;
  status: 'not_started' | 'in_planning' | 'active' | 'on_hold' | 'complete' | 'cancelled';
  description: string; startWeekOffset: number;
  tshirtSize?: 'S' | 'M' | 'L' | 'XL';
  category?: string;
  sponsor?: string;
  businessValue?: 'critical' | 'high' | 'medium' | 'low';
  requiredSkills?: string[];
  dependencies?: string[]; // project IDs
  milestones?: Milestone[];
  actualHours?: Record<string, number>; // phase -> actual hours
  quarterTarget?: string; // e.g. 'Q1 2026'
  riskLevel?: 'high' | 'medium' | 'low';
  riskNotes?: string;
  committedDate?: string;
}

export interface Milestone {
  id: string; name: string; targetWeek: number; status: 'pending' | 'complete' | 'at_risk' | 'missed';
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

export interface PTOEntry {
  id: string; teamId: string; role: string; personName: string;
  startWeek: number; endWeek: number; hoursPerWeek: number; reason: string;
}

export interface NewHire {
  id: string; teamId: string; role: string; personName: string;
  startWeek: number; rampWeeks: number; // weeks to reach 100%
}

export interface Settings {
  fiscalYearStartMonth: number; // 1-12
  defaultHoursPerWeek: number;
  holidays: { name: string; week: number }[];
  capacityThresholds: { amber: number; red: number };
  roleTemplates: { name: string; roles: Record<string, number> }[];
}

export interface ActualEntry {
  id: string; projectId: string; teamId: string; phase: string;
  week: number; hours: number; notes?: string;
}

// Initialize seed data
function createSeedData() {
  const web: Team = { id: uuid(), name: 'Web Platform', pmFte: 1, productManagerFte: 0.5, uxDesignerFte: null, businessAnalystFte: 0.5, scrumMasterFte: 0.5, architectFte: 1, developerFte: 4.0, qaFte: 1.5, devopsFte: 1.0, dbaFte: 0, kloTlmHoursPerWeek: 15, adminPct: 20, skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'GraphQL'] };
  const bizapps: Team = { id: uuid(), name: 'Business Applications', pmFte: 1, productManagerFte: 0.5, uxDesignerFte: null, businessAnalystFte: 1.5, scrumMasterFte: 0.5, architectFte: 0.5, developerFte: 3.5, qaFte: 1.5, devopsFte: 0.5, dbaFte: 0.5, kloTlmHoursPerWeek: 20, adminPct: 22, skills: ['Salesforce', '.NET', 'SQL Server', 'Power Platform', 'ServiceNow'] };
  const erp: Team = { id: uuid(), name: 'ERP & Supply Chain', pmFte: 1.5, productManagerFte: 0, uxDesignerFte: null, businessAnalystFte: 2.0, scrumMasterFte: 0, architectFte: 1.0, developerFte: 5.0, qaFte: 2.0, devopsFte: 1.0, dbaFte: 1.0, kloTlmHoursPerWeek: 30, adminPct: 18, skills: ['SAP S/4HANA', 'ABAP', 'SAP BTP', 'EDI', 'Oracle'] };
  const data: Team = { id: uuid(), name: 'Data & Analytics', pmFte: 0.5, productManagerFte: 0.5, uxDesignerFte: null, businessAnalystFte: 1.0, scrumMasterFte: 0, architectFte: 1.0, developerFte: 3.0, qaFte: 1.0, devopsFte: 0.5, dbaFte: 1.5, kloTlmHoursPerWeek: 12, adminPct: 20, skills: ['Snowflake', 'dbt', 'Python', 'Tableau', 'Spark', 'Airflow'] };
  const infraops: Team = { id: uuid(), name: 'Infrastructure & Cloud', pmFte: 0.5, productManagerFte: 0, uxDesignerFte: null, businessAnalystFte: 0, scrumMasterFte: 0, architectFte: 1.0, developerFte: 2.0, qaFte: 0.5, devopsFte: 3.0, dbaFte: 0, kloTlmHoursPerWeek: 40, adminPct: 15, skills: ['AWS', 'Azure', 'Terraform', 'Kubernetes', 'Linux', 'Networking'] };
  const security: Team = { id: uuid(), name: 'Cybersecurity', pmFte: 0.5, productManagerFte: 0, uxDesignerFte: null, businessAnalystFte: 0.5, scrumMasterFte: 0, architectFte: 1.0, developerFte: 2.0, qaFte: 1.0, devopsFte: 1.0, dbaFte: 0, kloTlmHoursPerWeek: 20, adminPct: 20, skills: ['SIEM', 'IAM', 'Penetration Testing', 'Zero Trust', 'Compliance'] };
  const mobile: Team = { id: uuid(), name: 'Mobile & Digital', pmFte: 0.5, productManagerFte: 1, uxDesignerFte: null, businessAnalystFte: 0.5, scrumMasterFte: 0.5, architectFte: 0.5, developerFte: 3.0, qaFte: 1.0, devopsFte: 0.5, dbaFte: 0, kloTlmHoursPerWeek: 10, adminPct: 20, skills: ['React Native', 'Swift', 'Kotlin', 'Firebase', 'Flutter'] };

  const teams = [web, bizapps, erp, data, infraops, security, mobile];

  const projectDefs: Omit<Project, 'id'>[] = [
    { name: 'Customer Portal Redesign', priority: 1, status: 'active', description: 'Complete overhaul of customer-facing portal with modern UX, SSO integration, and self-service capabilities. Expected to reduce call center volume by 30%.', startWeekOffset: 0, tshirtSize: 'L', category: 'Digital Transformation', sponsor: 'VP Sales', businessValue: 'critical', requiredSkills: ['React', 'TypeScript', 'AWS'], quarterTarget: 'Q1 2026', riskLevel: 'medium', committedDate: '2026-06-30', milestones: [{ id: uuid(), name: 'UX Design Complete', targetWeek: 6, status: 'complete' }, { id: uuid(), name: 'Beta Launch', targetWeek: 20, status: 'pending' }, { id: uuid(), name: 'GA Release', targetWeek: 28, status: 'pending' }] },
    { name: 'SAP S/4HANA Migration', priority: 2, status: 'active', description: 'Migrate on-premise SAP ECC to S/4HANA Cloud with zero downtime. Critical path for finance close automation.', startWeekOffset: 0, tshirtSize: 'XL', category: 'ERP Modernization', sponsor: 'CFO', businessValue: 'critical', requiredSkills: ['SAP S/4HANA', 'ABAP'], quarterTarget: 'Q1 2026', riskLevel: 'high', riskNotes: 'Complex data migration, limited SAP BTP expertise in-house', committedDate: '2026-12-31', milestones: [{ id: uuid(), name: 'Fit-Gap Complete', targetWeek: 8, status: 'complete' }, { id: uuid(), name: 'Data Migration Test', targetWeek: 24, status: 'pending' }, { id: uuid(), name: 'UAT Sign-off', targetWeek: 40, status: 'pending' }, { id: uuid(), name: 'Go Live', targetWeek: 48, status: 'pending' }] },
    { name: 'Data Lakehouse Platform', priority: 3, status: 'in_planning', description: 'Replace legacy data warehouse with Snowflake-based lakehouse for real-time analytics and ML capabilities.', startWeekOffset: 2, tshirtSize: 'L', category: 'Data & AI', sponsor: 'Chief Data Officer', businessValue: 'high', requiredSkills: ['Snowflake', 'dbt', 'Python'], quarterTarget: 'Q2 2026', riskLevel: 'medium', committedDate: '2026-09-30', milestones: [{ id: uuid(), name: 'Architecture Approved', targetWeek: 6, status: 'pending' }, { id: uuid(), name: 'Core Pipeline Live', targetWeek: 22, status: 'pending' }] },
    { name: 'Zero Trust Security Program', priority: 4, status: 'active', description: 'Implement zero trust network architecture across all IT systems. Board mandate after Q3 audit findings.', startWeekOffset: 0, tshirtSize: 'L', category: 'Security & Compliance', sponsor: 'CISO', businessValue: 'critical', requiredSkills: ['Zero Trust', 'IAM'], quarterTarget: 'Q1 2026', riskLevel: 'high', riskNotes: 'Tight regulatory deadline, cross-team dependencies', committedDate: '2026-06-30', milestones: [{ id: uuid(), name: 'Identity Platform Live', targetWeek: 12, status: 'pending' }, { id: uuid(), name: 'Network Segmentation', targetWeek: 24, status: 'pending' }] },
    { name: 'Mobile App Platform', priority: 5, status: 'in_planning', description: 'Build cross-platform mobile application for field sales, warehouse, and customer self-service.', startWeekOffset: 4, tshirtSize: 'L', category: 'Digital Transformation', sponsor: 'VP Sales', businessValue: 'high', requiredSkills: ['React Native', 'Firebase'], quarterTarget: 'Q2 2026', riskLevel: 'low', milestones: [{ id: uuid(), name: 'MVP Design', targetWeek: 10, status: 'pending' }] },
    { name: 'API Gateway & Microservices', priority: 6, status: 'not_started', description: 'Deploy enterprise API gateway and begin decomposing monolithic services for integration agility.', startWeekOffset: 6, tshirtSize: 'M', category: 'Architecture', sponsor: 'CTO', businessValue: 'high', requiredSkills: ['AWS', 'Node.js', 'Kubernetes'], quarterTarget: 'Q2 2026', riskLevel: 'medium' },
    { name: 'AI/ML Operations Platform', priority: 7, status: 'not_started', description: 'Stand up MLOps infrastructure for model training, deployment, and monitoring. Enables predictive supply chain.', startWeekOffset: 8, tshirtSize: 'M', category: 'Data & AI', sponsor: 'Chief Data Officer', businessValue: 'medium', requiredSkills: ['Python', 'Spark'], quarterTarget: 'Q3 2026', riskLevel: 'medium' },
    { name: 'Legacy System Decommission', priority: 8, status: 'not_started', description: 'Retire 3 legacy applications (AS/400 inventory, Access HR, FoxPro reporting) and migrate users.', startWeekOffset: 10, tshirtSize: 'M', category: 'Tech Debt', sponsor: 'VP Operations', businessValue: 'medium', requiredSkills: ['Salesforce', '.NET', 'SQL Server'], quarterTarget: 'Q3 2026', riskLevel: 'low', dependencies: [] },
    { name: 'SOX/SOC2 Compliance Automation', priority: 9, status: 'not_started', description: 'Automate SOX and SOC2 compliance reporting and evidence collection. Reduce audit prep from 6 weeks to 1.', startWeekOffset: 4, tshirtSize: 'M', category: 'Security & Compliance', sponsor: 'CFO', businessValue: 'high', requiredSkills: ['Compliance', 'ServiceNow'], quarterTarget: 'Q2 2026', riskLevel: 'low' },
    { name: 'Employee Experience Portal', priority: 10, status: 'not_started', description: 'Unified internal portal for HR, IT requests, knowledge base, and onboarding. Consolidates 5 separate tools.', startWeekOffset: 8, tshirtSize: 'M', category: 'Digital Transformation', sponsor: 'CHRO', businessValue: 'medium', requiredSkills: ['React', 'ServiceNow', 'Power Platform'], quarterTarget: 'Q3 2026', riskLevel: 'low' },
    { name: 'Cloud Cost Optimization', priority: 11, status: 'not_started', description: 'Right-size cloud infrastructure, implement FinOps practices. Target: 25% reduction in cloud spend ($1.2M/yr savings).', startWeekOffset: 2, tshirtSize: 'S', category: 'Infrastructure', sponsor: 'CFO', businessValue: 'high', requiredSkills: ['AWS', 'Azure', 'Terraform'], quarterTarget: 'Q1 2026', riskLevel: 'low' },
    { name: 'Salesforce CPQ Implementation', priority: 12, status: 'not_started', description: 'Configure-Price-Quote for sales team. Complex product catalog with 2000+ SKUs and volume discounting.', startWeekOffset: 6, tshirtSize: 'M', category: 'CRM', sponsor: 'VP Sales', businessValue: 'high', requiredSkills: ['Salesforce'], quarterTarget: 'Q2 2026', riskLevel: 'medium' },
    { name: 'Disaster Recovery Modernization', priority: 13, status: 'not_started', description: 'Upgrade DR capabilities to achieve RPO<1hr, RTO<4hr for all Tier 1 systems.', startWeekOffset: 10, tshirtSize: 'M', category: 'Infrastructure', sponsor: 'CTO', businessValue: 'critical', requiredSkills: ['AWS', 'Azure', 'Networking'], quarterTarget: 'Q3 2026', riskLevel: 'medium' },
    { name: 'Warehouse Management System', priority: 14, status: 'not_started', description: 'New WMS for 3 distribution centers. Barcode scanning, real-time inventory, pick-path optimization.', startWeekOffset: 12, tshirtSize: 'L', category: 'Supply Chain', sponsor: 'VP Operations', businessValue: 'high', requiredSkills: ['SAP S/4HANA', 'EDI'], quarterTarget: 'Q3 2026', riskLevel: 'high', riskNotes: 'Depends on SAP migration completion' },
    { name: 'Board Reporting Dashboard', priority: 15, status: 'not_started', description: 'Executive dashboards for board meetings. Real-time KPIs, financial metrics, operational scorecard.', startWeekOffset: 4, tshirtSize: 'S', category: 'Data & AI', sponsor: 'CEO', businessValue: 'medium', requiredSkills: ['Tableau', 'Snowflake'], quarterTarget: 'Q2 2026', riskLevel: 'low' },
    { name: 'Vendor Portal & EDI Upgrade', priority: 16, status: 'not_started', description: 'Self-service vendor portal with EDI AS2/SFTP integration. Onboard 200+ suppliers to electronic ordering.', startWeekOffset: 14, tshirtSize: 'M', category: 'Supply Chain', sponsor: 'VP Procurement', businessValue: 'medium', requiredSkills: ['EDI', '.NET'], quarterTarget: 'Q4 2026', riskLevel: 'medium' },
    { name: 'DevOps Pipeline Maturity', priority: 17, status: 'not_started', description: 'CI/CD standardization, automated testing, infrastructure as code across all teams.', startWeekOffset: 2, tshirtSize: 'S', category: 'Architecture', sponsor: 'CTO', businessValue: 'medium', requiredSkills: ['Kubernetes', 'Terraform', 'AWS'], quarterTarget: 'Q1 2026', riskLevel: 'low' },
    { name: 'Customer 360 Data Hub', priority: 18, status: 'not_started', description: 'Master data management for customer records across CRM, ERP, eCommerce. Single source of truth.', startWeekOffset: 16, tshirtSize: 'L', category: 'Data & AI', sponsor: 'VP Marketing', businessValue: 'high', requiredSkills: ['Snowflake', 'Salesforce', 'dbt'], quarterTarget: 'Q4 2026', riskLevel: 'high', riskNotes: 'Complex data governance challenges' },
    { name: 'IT Service Management Upgrade', priority: 19, status: 'not_started', description: 'ServiceNow upgrade + ITIL 4 process implementation. Improve incident resolution by 40%.', startWeekOffset: 8, tshirtSize: 'S', category: 'IT Operations', sponsor: 'VP IT Ops', businessValue: 'medium', requiredSkills: ['ServiceNow'], quarterTarget: 'Q3 2026', riskLevel: 'low' },
    { name: 'eCommerce Platform Upgrade', priority: 20, status: 'not_started', description: 'Migrate from legacy eCommerce to headless commerce (Shopify Plus + custom frontend). $50M revenue channel.', startWeekOffset: 12, tshirtSize: 'XL', category: 'Digital Transformation', sponsor: 'VP eCommerce', businessValue: 'critical', requiredSkills: ['React', 'TypeScript', 'GraphQL'], quarterTarget: 'Q4 2026', riskLevel: 'high', riskNotes: 'Revenue-critical, needs careful migration plan' },
  ];

  const projects: Project[] = projectDefs.map(p => ({ id: uuid(), ...p } as Project));

  // Set up dependencies
  projects[13].dependencies = [projects[1].id]; // WMS depends on SAP
  projects[7].dependencies = [projects[1].id]; // Legacy decommission depends on SAP
  projects[17].dependencies = [projects[2].id]; // Customer 360 depends on Data Lakehouse

  const estimateDefs = [
    // Customer Portal Redesign
    { pi: 0, tid: web.id, design: 80, development: 320, testing: 120, deployment: 24, postDeploy: 40, confidence: 'high' as const },
    { pi: 0, tid: security.id, design: 16, development: 40, testing: 24, deployment: 8, postDeploy: 8, confidence: 'high' as const },
    // SAP S/4HANA Migration
    { pi: 1, tid: erp.id, design: 160, development: 640, testing: 280, deployment: 120, postDeploy: 160, confidence: 'medium' as const },
    { pi: 1, tid: infraops.id, design: 40, development: 160, testing: 60, deployment: 60, postDeploy: 40, confidence: 'medium' as const },
    { pi: 1, tid: security.id, design: 24, development: 60, testing: 40, deployment: 16, postDeploy: 16, confidence: 'medium' as const },
    { pi: 1, tid: data.id, design: 40, development: 120, testing: 60, deployment: 20, postDeploy: 20, confidence: 'low' as const },
    // Data Lakehouse
    { pi: 2, tid: data.id, design: 100, development: 360, testing: 120, deployment: 40, postDeploy: 60, confidence: 'medium' as const },
    { pi: 2, tid: infraops.id, design: 24, development: 80, testing: 24, deployment: 24, postDeploy: 16, confidence: 'high' as const },
    // Zero Trust
    { pi: 3, tid: security.id, design: 80, development: 200, testing: 100, deployment: 60, postDeploy: 40, confidence: 'medium' as const },
    { pi: 3, tid: infraops.id, design: 40, development: 160, testing: 40, deployment: 40, postDeploy: 24, confidence: 'medium' as const },
    // Mobile App
    { pi: 4, tid: mobile.id, design: 80, development: 320, testing: 120, deployment: 24, postDeploy: 40, confidence: 'medium' as const },
    { pi: 4, tid: web.id, design: 20, development: 80, testing: 40, deployment: 8, postDeploy: 16, confidence: 'high' as const },
    // API Gateway
    { pi: 5, tid: web.id, design: 40, development: 160, testing: 60, deployment: 24, postDeploy: 24, confidence: 'medium' as const },
    { pi: 5, tid: infraops.id, design: 24, development: 80, testing: 24, deployment: 16, postDeploy: 8, confidence: 'high' as const },
    // AI/ML Platform
    { pi: 6, tid: data.id, design: 60, development: 200, testing: 80, deployment: 32, postDeploy: 40, confidence: 'low' as const },
    { pi: 6, tid: infraops.id, design: 16, development: 60, testing: 16, deployment: 16, postDeploy: 8, confidence: 'medium' as const },
    // Legacy Decommission
    { pi: 7, tid: bizapps.id, design: 24, development: 120, testing: 60, deployment: 24, postDeploy: 40, confidence: 'medium' as const },
    { pi: 7, tid: erp.id, design: 40, development: 160, testing: 80, deployment: 40, postDeploy: 60, confidence: 'medium' as const },
    // SOX/SOC2 Automation
    { pi: 8, tid: security.id, design: 32, development: 100, testing: 40, deployment: 16, postDeploy: 16, confidence: 'high' as const },
    { pi: 8, tid: bizapps.id, design: 16, development: 60, testing: 24, deployment: 8, postDeploy: 8, confidence: 'high' as const },
    // Employee Portal
    { pi: 9, tid: web.id, design: 40, development: 200, testing: 80, deployment: 16, postDeploy: 24, confidence: 'medium' as const },
    { pi: 9, tid: bizapps.id, design: 24, development: 100, testing: 40, deployment: 16, postDeploy: 16, confidence: 'medium' as const },
    // Cloud Cost Optimization
    { pi: 10, tid: infraops.id, design: 20, development: 60, testing: 16, deployment: 8, postDeploy: 16, confidence: 'high' as const },
    // Salesforce CPQ
    { pi: 11, tid: bizapps.id, design: 40, development: 200, testing: 80, deployment: 24, postDeploy: 40, confidence: 'medium' as const },
    // DR Modernization
    { pi: 12, tid: infraops.id, design: 40, development: 120, testing: 60, deployment: 40, postDeploy: 24, confidence: 'medium' as const },
    // Warehouse Management
    { pi: 13, tid: erp.id, design: 80, development: 320, testing: 160, deployment: 60, postDeploy: 80, confidence: 'low' as const },
    { pi: 13, tid: mobile.id, design: 24, development: 80, testing: 40, deployment: 8, postDeploy: 16, confidence: 'medium' as const },
    // Board Reporting Dashboard
    { pi: 14, tid: data.id, design: 24, development: 80, testing: 24, deployment: 8, postDeploy: 16, confidence: 'high' as const },
    // Vendor Portal
    { pi: 15, tid: bizapps.id, design: 32, development: 160, testing: 60, deployment: 24, postDeploy: 24, confidence: 'medium' as const },
    { pi: 15, tid: erp.id, design: 16, development: 60, testing: 24, deployment: 8, postDeploy: 8, confidence: 'medium' as const },
    // DevOps Pipeline
    { pi: 16, tid: infraops.id, design: 16, development: 80, testing: 24, deployment: 16, postDeploy: 8, confidence: 'high' as const },
    // Customer 360
    { pi: 17, tid: data.id, design: 60, development: 240, testing: 100, deployment: 32, postDeploy: 40, confidence: 'low' as const },
    { pi: 17, tid: bizapps.id, design: 24, development: 80, testing: 40, deployment: 8, postDeploy: 16, confidence: 'low' as const },
    // ITSM Upgrade
    { pi: 18, tid: bizapps.id, design: 16, development: 60, testing: 24, deployment: 8, postDeploy: 16, confidence: 'high' as const },
    // eCommerce
    { pi: 19, tid: web.id, design: 80, development: 400, testing: 160, deployment: 40, postDeploy: 60, confidence: 'low' as const },
    { pi: 19, tid: mobile.id, design: 24, development: 120, testing: 40, deployment: 16, postDeploy: 16, confidence: 'low' as const },
    { pi: 19, tid: data.id, design: 16, development: 40, testing: 16, deployment: 8, postDeploy: 8, confidence: 'medium' as const },
  ];

  const teamEstimates: TeamEstimate[] = estimateDefs.map(e => ({
    id: uuid(), projectId: projects[e.pi].id, teamId: e.tid,
    design: e.design, development: e.development, testing: e.testing,
    deployment: e.deployment, postDeploy: e.postDeploy,
    confidence: e.confidence,
  }));

  const baseScenario: Scenario = { id: uuid(), name: 'Baseline', locked: false };
  const augScenario: Scenario = { id: uuid(), name: 'Staff Augmentation Q2', locked: false };
  const deferScenario: Scenario = { id: uuid(), name: 'Defer Low Priority', locked: false };

  const scenarios = [baseScenario, augScenario, deferScenario];

  const contractors: Contractor[] = [
    { id: uuid(), scenarioId: augScenario.id, teamId: erp.id, roleKey: 'developer', fte: 2.0, weeks: 26, label: 'SAP Consultants (Deloitte)', startWeek: 4 },
    { id: uuid(), scenarioId: augScenario.id, teamId: erp.id, roleKey: 'qa', fte: 1.0, weeks: 20, label: 'Contract QA - ERP', startWeek: 8 },
    { id: uuid(), scenarioId: augScenario.id, teamId: security.id, roleKey: 'architect', fte: 0.5, weeks: 16, label: 'Zero Trust Architect (CrowdStrike)', startWeek: 0 },
    { id: uuid(), scenarioId: augScenario.id, teamId: data.id, roleKey: 'developer', fte: 1.0, weeks: 20, label: 'Snowflake Engineer (Contract)', startWeek: 4 },
  ];

  const priorityOverrides: PriorityOverride[] = [
    { id: uuid(), scenarioId: deferScenario.id, projectId: projects[14].id, priority: 25 }, // Board Dashboard deprioritized
    { id: uuid(), scenarioId: deferScenario.id, projectId: projects[15].id, priority: 25 }, // Vendor Portal deprioritized
    { id: uuid(), scenarioId: deferScenario.id, projectId: projects[17].id, priority: 25 }, // Customer 360 deprioritized
  ];

  // Actual hours for active projects (partial tracking)
  const actuals: ActualEntry[] = [
    { id: uuid(), projectId: projects[0].id, teamId: web.id, phase: 'design', week: 1, hours: 18 },
    { id: uuid(), projectId: projects[0].id, teamId: web.id, phase: 'design', week: 2, hours: 22 },
    { id: uuid(), projectId: projects[0].id, teamId: web.id, phase: 'design', week: 3, hours: 20 },
    { id: uuid(), projectId: projects[0].id, teamId: web.id, phase: 'design', week: 4, hours: 24 },
    { id: uuid(), projectId: projects[0].id, teamId: web.id, phase: 'development', week: 5, hours: 30 },
    { id: uuid(), projectId: projects[0].id, teamId: web.id, phase: 'development', week: 6, hours: 35 },
    { id: uuid(), projectId: projects[1].id, teamId: erp.id, phase: 'design', week: 1, hours: 28 },
    { id: uuid(), projectId: projects[1].id, teamId: erp.id, phase: 'design', week: 2, hours: 32 },
    { id: uuid(), projectId: projects[1].id, teamId: erp.id, phase: 'design', week: 3, hours: 36 },
    { id: uuid(), projectId: projects[1].id, teamId: erp.id, phase: 'design', week: 4, hours: 30 },
    { id: uuid(), projectId: projects[1].id, teamId: erp.id, phase: 'design', week: 5, hours: 34 },
    { id: uuid(), projectId: projects[3].id, teamId: security.id, phase: 'design', week: 1, hours: 15 },
    { id: uuid(), projectId: projects[3].id, teamId: security.id, phase: 'design', week: 2, hours: 18 },
    { id: uuid(), projectId: projects[3].id, teamId: security.id, phase: 'design', week: 3, hours: 22 },
  ];

  // PTO entries
  const ptoEntries: PTOEntry[] = [
    { id: uuid(), teamId: web.id, role: 'developer', personName: 'Alex Chen', startWeek: 10, endWeek: 12, hoursPerWeek: 40, reason: 'Vacation' },
    { id: uuid(), teamId: erp.id, role: 'architect', personName: 'Maria Rodriguez', startWeek: 16, endWeek: 17, hoursPerWeek: 40, reason: 'Conference' },
    { id: uuid(), teamId: data.id, role: 'developer', personName: 'James Wilson', startWeek: 22, endWeek: 24, hoursPerWeek: 40, reason: 'Paternity Leave' },
  ];

  // New hires
  const newHires: NewHire[] = [
    { id: uuid(), teamId: web.id, role: 'developer', personName: 'New Senior Dev', startWeek: 8, rampWeeks: 8 },
    { id: uuid(), teamId: erp.id, role: 'developer', personName: 'SAP Developer', startWeek: 12, rampWeeks: 12 },
  ];

  const settings: Settings = {
    fiscalYearStartMonth: 1,
    defaultHoursPerWeek: 40,
    holidays: [
      { name: 'New Year', week: 1 }, { name: 'MLK Day', week: 3 },
      { name: 'Presidents Day', week: 8 }, { name: 'Memorial Day', week: 22 },
      { name: 'Independence Day', week: 27 }, { name: 'Labor Day', week: 36 },
      { name: 'Thanksgiving', week: 48 }, { name: 'Christmas', week: 52 },
    ],
    capacityThresholds: { amber: 75, red: 90 },
    roleTemplates: [
      { name: 'Small Team', roles: { architect: 0.5, developer: 2, qa: 0.5, devops: 0.5 } },
      { name: 'Medium Team', roles: { pm: 0.5, architect: 1, developer: 4, qa: 1.5, devops: 1, businessAnalyst: 0.5 } },
      { name: 'Large Team', roles: { pm: 1, productManager: 0.5, architect: 1.5, developer: 6, qa: 2, devops: 1.5, dba: 1, businessAnalyst: 1 } },
    ],
  };

  return { teams, projects, teamEstimates, scenarios, contractors, priorityOverrides, actuals, ptoEntries, newHires, settings };
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
  const project = { ...data, id: uuid() } as Project;
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

// Actuals
export function getActuals(projectId?: string) {
  return projectId ? store.actuals.filter(a => a.projectId === projectId) : store.actuals;
}
export function addActual(data: Omit<ActualEntry, 'id'>) {
  const entry = { ...data, id: uuid() };
  store.actuals.push(entry);
  return entry;
}

// PTO
export function getPTOEntries(teamId?: string) {
  return teamId ? store.ptoEntries.filter(p => p.teamId === teamId) : store.ptoEntries;
}
export function addPTOEntry(data: Omit<PTOEntry, 'id'>) {
  const entry = { ...data, id: uuid() };
  store.ptoEntries.push(entry);
  return entry;
}
export function removePTOEntry(id: string) {
  const idx = store.ptoEntries.findIndex(p => p.id === id);
  if (idx >= 0) store.ptoEntries.splice(idx, 1);
}

// New Hires
export function getNewHires(teamId?: string) {
  return teamId ? store.newHires.filter(h => h.teamId === teamId) : store.newHires;
}
export function addNewHire(data: Omit<NewHire, 'id'>) {
  const entry = { ...data, id: uuid() };
  store.newHires.push(entry);
  return entry;
}
export function removeNewHire(id: string) {
  const idx = store.newHires.findIndex(h => h.id === id);
  if (idx >= 0) store.newHires.splice(idx, 1);
}

// Settings
export function getSettings() { return store.settings; }
export function updateSettings(data: Partial<Settings>) {
  Object.assign(store.settings, data);
  return store.settings;
}
