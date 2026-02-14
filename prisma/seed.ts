import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Check if already seeded
  const existingOrg = await prisma.organization.findUnique({ where: { slug: 'acme-corp' } });
  if (existingOrg) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  const passwordHash = await bcrypt.hash('password123', 12);

  // Create org
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      holidays: [
        { name: 'New Year', week: 1 }, { name: 'MLK Day', week: 3 },
        { name: 'Presidents Day', week: 8 }, { name: 'Memorial Day', week: 22 },
        { name: 'Independence Day', week: 27 }, { name: 'Labor Day', week: 36 },
        { name: 'Thanksgiving', week: 48 }, { name: 'Christmas', week: 52 },
      ],
      roleTemplates: [
        { name: 'Small Team', roles: { architect: 0.5, developer: 2, qa: 0.5, devops: 0.5 } },
        { name: 'Medium Team', roles: { pm: 0.5, architect: 1, developer: 4, qa: 1.5, devops: 1, businessAnalyst: 0.5 } },
        { name: 'Large Team', roles: { pm: 1, productManager: 0.5, architect: 1.5, developer: 6, qa: 2, devops: 1.5, dba: 1, businessAnalyst: 1 } },
      ],
    },
  });

  // Create admin user
  await prisma.user.create({
    data: { email: 'admin@acme.com', name: 'Admin User', passwordHash, role: 'OWNER', orgId: org.id },
  });

  // Create viewer user
  await prisma.user.create({
    data: { email: 'viewer@acme.com', name: 'Viewer User', passwordHash, role: 'VIEWER', orgId: org.id },
  });

  // Teams
  const teamDefs = [
    { name: 'Web Platform', description: 'Customer-facing web applications and internal tools', department: 'Engineering', costCenter: 'ENG-100', managerName: 'Sarah Johnson', location: 'San Francisco', timezone: 'America/Los_Angeles', pmFte: 1, productManagerFte: 0.5, businessAnalystFte: 0.5, scrumMasterFte: 0.5, architectFte: 1, developerFte: 4.0, qaFte: 1.5, devopsFte: 1.0, dbaFte: 0, kloTlmHoursPerWeek: 15, adminPct: 20, skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'GraphQL'] },
    { name: 'Business Applications', description: 'Salesforce, ServiceNow, and internal business tools', department: 'IT', costCenter: 'IT-200', managerName: 'Carlos Mendez', location: 'Chicago', timezone: 'America/Chicago', pmFte: 1, productManagerFte: 0.5, businessAnalystFte: 1.5, scrumMasterFte: 0.5, architectFte: 0.5, developerFte: 3.5, qaFte: 1.5, devopsFte: 0.5, dbaFte: 0.5, kloTlmHoursPerWeek: 20, adminPct: 22, skills: ['Salesforce', '.NET', 'SQL Server', 'Power Platform', 'ServiceNow'] },
    { name: 'ERP & Supply Chain', description: 'SAP S/4HANA migration and supply chain systems', department: 'IT', costCenter: 'IT-300', managerName: 'Maria Rodriguez', location: 'Dallas', timezone: 'America/Chicago', pmFte: 1.5, productManagerFte: 0, businessAnalystFte: 2.0, scrumMasterFte: 0, architectFte: 1.0, developerFte: 5.0, qaFte: 2.0, devopsFte: 1.0, dbaFte: 1.0, kloTlmHoursPerWeek: 30, adminPct: 18, skills: ['SAP S/4HANA', 'ABAP', 'SAP BTP', 'EDI', 'Oracle'] },
    { name: 'Data & Analytics', description: 'Data warehouse, BI, and analytics platform', department: 'Data', costCenter: 'DATA-100', managerName: 'Amanda Foster', location: 'Remote', timezone: 'America/New_York', pmFte: 0.5, productManagerFte: 0.5, businessAnalystFte: 1.0, scrumMasterFte: 0, architectFte: 1.0, developerFte: 3.0, qaFte: 1.0, devopsFte: 0.5, dbaFte: 1.5, kloTlmHoursPerWeek: 12, adminPct: 20, skills: ['Snowflake', 'dbt', 'Python', 'Tableau', 'Spark', 'Airflow'] },
    { name: 'Infrastructure & Cloud', description: 'Cloud infrastructure, DevOps, and SRE', department: 'Engineering', costCenter: 'ENG-200', managerName: 'Marcus Johnson', location: 'San Francisco', timezone: 'America/Los_Angeles', pmFte: 0.5, productManagerFte: 0, businessAnalystFte: 0, scrumMasterFte: 0, architectFte: 1.0, developerFte: 2.0, qaFte: 0.5, devopsFte: 3.0, dbaFte: 0, kloTlmHoursPerWeek: 40, adminPct: 15, skills: ['AWS', 'Azure', 'Terraform', 'Kubernetes', 'Linux', 'Networking'] },
    { name: 'Cybersecurity', description: 'Security operations, compliance, and zero trust', department: 'Security', costCenter: 'SEC-100', managerName: 'Frank Nguyen', location: 'New York', timezone: 'America/New_York', pmFte: 0.5, productManagerFte: 0, businessAnalystFte: 0.5, scrumMasterFte: 0, architectFte: 1.0, developerFte: 2.0, qaFte: 1.0, devopsFte: 1.0, dbaFte: 0, kloTlmHoursPerWeek: 20, adminPct: 20, skills: ['SIEM', 'IAM', 'Penetration Testing', 'Zero Trust', 'Compliance'] },
    { name: 'Mobile & Digital', description: 'iOS, Android, and cross-platform mobile apps', department: 'Engineering', costCenter: 'ENG-300', managerName: 'Diana Cruz', location: 'Austin', timezone: 'America/Chicago', pmFte: 0.5, productManagerFte: 1, businessAnalystFte: 0.5, scrumMasterFte: 0.5, architectFte: 0.5, developerFte: 3.0, qaFte: 1.0, devopsFte: 0.5, dbaFte: 0, kloTlmHoursPerWeek: 10, adminPct: 20, skills: ['React Native', 'Swift', 'Kotlin', 'Firebase', 'Flutter'] },
  ];

  const teams: any[] = [];
  for (const t of teamDefs) {
    const { skills, ...rest } = t;
    const team = await prisma.team.create({
      data: { ...rest, skills: skills, orgId: org.id },
    });
    teams.push(team);
  }

  const [web, bizapps, erp, data, infraops, security, mobile] = teams;

  // Projects
  const projectDefs = [
    { name: 'Customer Portal Redesign', priority: 1, status: 'active', description: 'Complete overhaul of customer-facing portal with modern UX, SSO integration, and self-service capabilities.', startWeekOffset: 0, tshirtSize: 'L', category: 'Digital Transformation', sponsor: 'VP Sales', businessValue: 'critical', quarterTarget: 'Q1 2026', riskLevel: 'medium', committedDate: '2026-06-30', milestones: [{ id: 'm1', name: 'UX Design Complete', targetWeek: 6, status: 'complete' }, { id: 'm2', name: 'Beta Launch', targetWeek: 20, status: 'pending' }, { id: 'm3', name: 'GA Release', targetWeek: 28, status: 'pending' }] },
    { name: 'SAP S/4HANA Migration', priority: 2, status: 'active', description: 'Migrate on-premise SAP ECC to S/4HANA Cloud with zero downtime.', startWeekOffset: 0, tshirtSize: 'XL', category: 'ERP Modernization', sponsor: 'CFO', businessValue: 'critical', quarterTarget: 'Q1 2026', riskLevel: 'high', riskNotes: 'Complex data migration, limited SAP BTP expertise in-house', committedDate: '2026-12-31', milestones: [{ id: 'm4', name: 'Fit-Gap Complete', targetWeek: 8, status: 'complete' }, { id: 'm5', name: 'Data Migration Test', targetWeek: 24, status: 'pending' }, { id: 'm6', name: 'UAT Sign-off', targetWeek: 40, status: 'pending' }, { id: 'm7', name: 'Go Live', targetWeek: 48, status: 'pending' }] },
    { name: 'Data Lakehouse Platform', priority: 3, status: 'in_planning', description: 'Replace legacy data warehouse with Snowflake-based lakehouse.', startWeekOffset: 2, tshirtSize: 'L', category: 'Data & AI', sponsor: 'Chief Data Officer', businessValue: 'high', quarterTarget: 'Q2 2026', riskLevel: 'medium', committedDate: '2026-09-30' },
    { name: 'Zero Trust Security Program', priority: 4, status: 'active', description: 'Implement zero trust network architecture across all IT systems.', startWeekOffset: 0, tshirtSize: 'L', category: 'Security & Compliance', sponsor: 'CISO', businessValue: 'critical', quarterTarget: 'Q1 2026', riskLevel: 'high', riskNotes: 'Tight regulatory deadline, cross-team dependencies', committedDate: '2026-06-30' },
    { name: 'Mobile App Platform', priority: 5, status: 'in_planning', description: 'Build cross-platform mobile application for field sales.', startWeekOffset: 4, tshirtSize: 'L', category: 'Digital Transformation', sponsor: 'VP Sales', businessValue: 'high', quarterTarget: 'Q2 2026', riskLevel: 'low' },
    { name: 'API Gateway & Microservices', priority: 6, status: 'not_started', description: 'Deploy enterprise API gateway and begin decomposing monolithic services.', startWeekOffset: 6, tshirtSize: 'M', category: 'Architecture', sponsor: 'CTO', businessValue: 'high', quarterTarget: 'Q2 2026', riskLevel: 'medium' },
    { name: 'AI/ML Operations Platform', priority: 7, status: 'not_started', description: 'Stand up MLOps infrastructure for model training and deployment.', startWeekOffset: 8, tshirtSize: 'M', category: 'Data & AI', sponsor: 'Chief Data Officer', businessValue: 'medium', quarterTarget: 'Q3 2026', riskLevel: 'medium' },
    { name: 'Legacy System Decommission', priority: 8, status: 'not_started', description: 'Retire 3 legacy applications and migrate users.', startWeekOffset: 10, tshirtSize: 'M', category: 'Tech Debt', sponsor: 'VP Operations', businessValue: 'medium', quarterTarget: 'Q3 2026', riskLevel: 'low' },
    { name: 'SOX/SOC2 Compliance Automation', priority: 9, status: 'not_started', description: 'Automate compliance reporting and evidence collection.', startWeekOffset: 4, tshirtSize: 'M', category: 'Security & Compliance', sponsor: 'CFO', businessValue: 'high', quarterTarget: 'Q2 2026', riskLevel: 'low' },
    { name: 'Employee Experience Portal', priority: 10, status: 'not_started', description: 'Unified internal portal for HR, IT requests, knowledge base.', startWeekOffset: 8, tshirtSize: 'M', category: 'Digital Transformation', sponsor: 'CHRO', businessValue: 'medium', quarterTarget: 'Q3 2026', riskLevel: 'low' },
    { name: 'Cloud Cost Optimization', priority: 11, status: 'not_started', description: 'Right-size cloud infrastructure, implement FinOps practices.', startWeekOffset: 2, tshirtSize: 'S', category: 'Infrastructure', sponsor: 'CFO', businessValue: 'high', quarterTarget: 'Q1 2026', riskLevel: 'low' },
    { name: 'Salesforce CPQ Implementation', priority: 12, status: 'not_started', description: 'Configure-Price-Quote for sales team.', startWeekOffset: 6, tshirtSize: 'M', category: 'CRM', sponsor: 'VP Sales', businessValue: 'high', quarterTarget: 'Q2 2026', riskLevel: 'medium' },
    { name: 'Disaster Recovery Modernization', priority: 13, status: 'not_started', description: 'Upgrade DR capabilities to achieve RPO<1hr, RTO<4hr.', startWeekOffset: 10, tshirtSize: 'M', category: 'Infrastructure', sponsor: 'CTO', businessValue: 'critical', quarterTarget: 'Q3 2026', riskLevel: 'medium' },
    { name: 'Warehouse Management System', priority: 14, status: 'not_started', description: 'New WMS for 3 distribution centers.', startWeekOffset: 12, tshirtSize: 'L', category: 'Supply Chain', sponsor: 'VP Operations', businessValue: 'high', quarterTarget: 'Q3 2026', riskLevel: 'high', riskNotes: 'Depends on SAP migration completion' },
    { name: 'Board Reporting Dashboard', priority: 15, status: 'not_started', description: 'Executive dashboards for board meetings.', startWeekOffset: 4, tshirtSize: 'S', category: 'Data & AI', sponsor: 'CEO', businessValue: 'medium', quarterTarget: 'Q2 2026', riskLevel: 'low' },
    { name: 'Vendor Portal & EDI Upgrade', priority: 16, status: 'not_started', description: 'Self-service vendor portal with EDI integration.', startWeekOffset: 14, tshirtSize: 'M', category: 'Supply Chain', sponsor: 'VP Procurement', businessValue: 'medium', quarterTarget: 'Q4 2026', riskLevel: 'medium' },
    { name: 'DevOps Pipeline Maturity', priority: 17, status: 'not_started', description: 'CI/CD standardization across all teams.', startWeekOffset: 2, tshirtSize: 'S', category: 'Architecture', sponsor: 'CTO', businessValue: 'medium', quarterTarget: 'Q1 2026', riskLevel: 'low' },
    { name: 'Customer 360 Data Hub', priority: 18, status: 'not_started', description: 'Master data management for customer records.', startWeekOffset: 16, tshirtSize: 'L', category: 'Data & AI', sponsor: 'VP Marketing', businessValue: 'high', quarterTarget: 'Q4 2026', riskLevel: 'high', riskNotes: 'Complex data governance challenges' },
    { name: 'IT Service Management Upgrade', priority: 19, status: 'not_started', description: 'ServiceNow upgrade + ITIL 4 process implementation.', startWeekOffset: 8, tshirtSize: 'S', category: 'IT Operations', sponsor: 'VP IT Ops', businessValue: 'medium', quarterTarget: 'Q3 2026', riskLevel: 'low' },
    { name: 'eCommerce Platform Upgrade', priority: 20, status: 'not_started', description: 'Migrate from legacy eCommerce to headless commerce.', startWeekOffset: 12, tshirtSize: 'XL', category: 'Digital Transformation', sponsor: 'VP eCommerce', businessValue: 'critical', quarterTarget: 'Q4 2026', riskLevel: 'high', riskNotes: 'Revenue-critical, needs careful migration plan' },
  ];

  const projects: any[] = [];
  for (const p of projectDefs) {
    const { milestones, ...rest } = p as any;
    const project = await prisma.project.create({
      data: {
        ...rest,
        requiredSkills: [],
        dependencies: [],
        milestones: milestones || [],
        actualHours: {},
        orgId: org.id,
      },
    });
    projects.push(project);
  }

  // Set dependencies
  await prisma.project.update({ where: { id: projects[13].id }, data: { dependencies: [projects[1].id] } });
  await prisma.project.update({ where: { id: projects[7].id }, data: { dependencies: [projects[1].id] } });
  await prisma.project.update({ where: { id: projects[17].id }, data: { dependencies: [projects[2].id] } });

  // Team Estimates
  const estimateDefs = [
    { pi: 0, tid: web.id, design: 80, development: 320, testing: 120, deployment: 24, postDeploy: 40, confidence: 'high' },
    { pi: 0, tid: security.id, design: 16, development: 40, testing: 24, deployment: 8, postDeploy: 8, confidence: 'high' },
    { pi: 1, tid: erp.id, design: 160, development: 640, testing: 280, deployment: 120, postDeploy: 160, confidence: 'medium' },
    { pi: 1, tid: infraops.id, design: 40, development: 160, testing: 60, deployment: 60, postDeploy: 40, confidence: 'medium' },
    { pi: 1, tid: security.id, design: 24, development: 60, testing: 40, deployment: 16, postDeploy: 16, confidence: 'medium' },
    { pi: 1, tid: data.id, design: 40, development: 120, testing: 60, deployment: 20, postDeploy: 20, confidence: 'low' },
    { pi: 2, tid: data.id, design: 100, development: 360, testing: 120, deployment: 40, postDeploy: 60, confidence: 'medium' },
    { pi: 2, tid: infraops.id, design: 24, development: 80, testing: 24, deployment: 24, postDeploy: 16, confidence: 'high' },
    { pi: 3, tid: security.id, design: 80, development: 200, testing: 100, deployment: 60, postDeploy: 40, confidence: 'medium' },
    { pi: 3, tid: infraops.id, design: 40, development: 160, testing: 40, deployment: 40, postDeploy: 24, confidence: 'medium' },
    { pi: 4, tid: mobile.id, design: 80, development: 320, testing: 120, deployment: 24, postDeploy: 40, confidence: 'medium' },
    { pi: 4, tid: web.id, design: 20, development: 80, testing: 40, deployment: 8, postDeploy: 16, confidence: 'high' },
    { pi: 5, tid: web.id, design: 40, development: 160, testing: 60, deployment: 24, postDeploy: 24, confidence: 'medium' },
    { pi: 5, tid: infraops.id, design: 24, development: 80, testing: 24, deployment: 16, postDeploy: 8, confidence: 'high' },
    { pi: 6, tid: data.id, design: 60, development: 200, testing: 80, deployment: 32, postDeploy: 40, confidence: 'low' },
    { pi: 6, tid: infraops.id, design: 16, development: 60, testing: 16, deployment: 16, postDeploy: 8, confidence: 'medium' },
    { pi: 7, tid: bizapps.id, design: 24, development: 120, testing: 60, deployment: 24, postDeploy: 40, confidence: 'medium' },
    { pi: 7, tid: erp.id, design: 40, development: 160, testing: 80, deployment: 40, postDeploy: 60, confidence: 'medium' },
    { pi: 8, tid: security.id, design: 32, development: 100, testing: 40, deployment: 16, postDeploy: 16, confidence: 'high' },
    { pi: 8, tid: bizapps.id, design: 16, development: 60, testing: 24, deployment: 8, postDeploy: 8, confidence: 'high' },
    { pi: 9, tid: web.id, design: 40, development: 200, testing: 80, deployment: 16, postDeploy: 24, confidence: 'medium' },
    { pi: 9, tid: bizapps.id, design: 24, development: 100, testing: 40, deployment: 16, postDeploy: 16, confidence: 'medium' },
    { pi: 10, tid: infraops.id, design: 20, development: 60, testing: 16, deployment: 8, postDeploy: 16, confidence: 'high' },
    { pi: 11, tid: bizapps.id, design: 40, development: 200, testing: 80, deployment: 24, postDeploy: 40, confidence: 'medium' },
    { pi: 12, tid: infraops.id, design: 40, development: 120, testing: 60, deployment: 40, postDeploy: 24, confidence: 'medium' },
    { pi: 13, tid: erp.id, design: 80, development: 320, testing: 160, deployment: 60, postDeploy: 80, confidence: 'low' },
    { pi: 13, tid: mobile.id, design: 24, development: 80, testing: 40, deployment: 8, postDeploy: 16, confidence: 'medium' },
    { pi: 14, tid: data.id, design: 24, development: 80, testing: 24, deployment: 8, postDeploy: 16, confidence: 'high' },
    { pi: 15, tid: bizapps.id, design: 32, development: 160, testing: 60, deployment: 24, postDeploy: 24, confidence: 'medium' },
    { pi: 15, tid: erp.id, design: 16, development: 60, testing: 24, deployment: 8, postDeploy: 8, confidence: 'medium' },
    { pi: 16, tid: infraops.id, design: 16, development: 80, testing: 24, deployment: 16, postDeploy: 8, confidence: 'high' },
    { pi: 17, tid: data.id, design: 60, development: 240, testing: 100, deployment: 32, postDeploy: 40, confidence: 'low' },
    { pi: 17, tid: bizapps.id, design: 24, development: 80, testing: 40, deployment: 8, postDeploy: 16, confidence: 'low' },
    { pi: 18, tid: bizapps.id, design: 16, development: 60, testing: 24, deployment: 8, postDeploy: 16, confidence: 'high' },
    { pi: 19, tid: web.id, design: 80, development: 400, testing: 160, deployment: 40, postDeploy: 60, confidence: 'low' },
    { pi: 19, tid: mobile.id, design: 24, development: 120, testing: 40, deployment: 16, postDeploy: 16, confidence: 'low' },
    { pi: 19, tid: data.id, design: 16, development: 40, testing: 16, deployment: 8, postDeploy: 8, confidence: 'medium' },
  ];

  for (const e of estimateDefs) {
    await prisma.teamEstimate.create({
      data: {
        projectId: projects[e.pi].id,
        teamId: e.tid,
        design: e.design,
        development: e.development,
        testing: e.testing,
        deployment: e.deployment,
        postDeploy: e.postDeploy,
        confidence: e.confidence,
        orgId: org.id,
      },
    });
  }

  // Scenarios
  const baseScenario = await prisma.scenario.create({ data: { name: 'Baseline', orgId: org.id } });
  const augScenario = await prisma.scenario.create({ data: { name: 'Staff Augmentation Q2', orgId: org.id } });
  const deferScenario = await prisma.scenario.create({ data: { name: 'Defer Low Priority', orgId: org.id } });

  // Contractors
  await prisma.contractor.createMany({
    data: [
      { scenarioId: augScenario.id, teamId: erp.id, roleKey: 'developer', fte: 2.0, weeks: 26, label: 'SAP Consultants (Deloitte)', startWeek: 4, orgId: org.id },
      { scenarioId: augScenario.id, teamId: erp.id, roleKey: 'qa', fte: 1.0, weeks: 20, label: 'Contract QA - ERP', startWeek: 8, orgId: org.id },
      { scenarioId: augScenario.id, teamId: security.id, roleKey: 'architect', fte: 0.5, weeks: 16, label: 'Zero Trust Architect (CrowdStrike)', startWeek: 0, orgId: org.id },
      { scenarioId: augScenario.id, teamId: data.id, roleKey: 'developer', fte: 1.0, weeks: 20, label: 'Snowflake Engineer (Contract)', startWeek: 4, orgId: org.id },
    ],
  });

  // Priority overrides
  await prisma.priorityOverride.createMany({
    data: [
      { scenarioId: deferScenario.id, projectId: projects[14].id, priority: 25, orgId: org.id },
      { scenarioId: deferScenario.id, projectId: projects[15].id, priority: 25, orgId: org.id },
      { scenarioId: deferScenario.id, projectId: projects[17].id, priority: 25, orgId: org.id },
    ],
  });

  // Actuals
  const actualDefs = [
    { projectId: projects[0].id, teamId: web.id, phase: 'design', week: 1, hours: 18 },
    { projectId: projects[0].id, teamId: web.id, phase: 'design', week: 2, hours: 22 },
    { projectId: projects[0].id, teamId: web.id, phase: 'design', week: 3, hours: 20 },
    { projectId: projects[0].id, teamId: web.id, phase: 'design', week: 4, hours: 24 },
    { projectId: projects[0].id, teamId: web.id, phase: 'development', week: 5, hours: 30 },
    { projectId: projects[0].id, teamId: web.id, phase: 'development', week: 6, hours: 35 },
    { projectId: projects[1].id, teamId: erp.id, phase: 'design', week: 1, hours: 28 },
    { projectId: projects[1].id, teamId: erp.id, phase: 'design', week: 2, hours: 32 },
    { projectId: projects[1].id, teamId: erp.id, phase: 'design', week: 3, hours: 36 },
    { projectId: projects[1].id, teamId: erp.id, phase: 'design', week: 4, hours: 30 },
    { projectId: projects[1].id, teamId: erp.id, phase: 'design', week: 5, hours: 34 },
    { projectId: projects[3].id, teamId: security.id, phase: 'design', week: 1, hours: 15 },
    { projectId: projects[3].id, teamId: security.id, phase: 'design', week: 2, hours: 18 },
    { projectId: projects[3].id, teamId: security.id, phase: 'design', week: 3, hours: 22 },
  ];

  for (const a of actualDefs) {
    await prisma.actualEntry.create({ data: { ...a, orgId: org.id } });
  }

  // PTO entries
  await prisma.pTOEntry.createMany({
    data: [
      { teamId: web.id, role: 'developer', personName: 'Alex Chen', startWeek: 10, endWeek: 12, hoursPerWeek: 40, reason: 'Vacation', orgId: org.id },
      { teamId: erp.id, role: 'architect', personName: 'Maria Rodriguez', startWeek: 16, endWeek: 17, hoursPerWeek: 40, reason: 'Conference', orgId: org.id },
      { teamId: data.id, role: 'developer', personName: 'James Wilson', startWeek: 22, endWeek: 24, hoursPerWeek: 40, reason: 'Paternity Leave', orgId: org.id },
    ],
  });

  // New hires
  await prisma.newHire.createMany({
    data: [
      { teamId: web.id, role: 'developer', personName: 'New Senior Dev', startWeek: 8, rampWeeks: 8, orgId: org.id },
      { teamId: erp.id, role: 'developer', personName: 'SAP Developer', startWeek: 12, rampWeeks: 12, orgId: org.id },
    ],
  });

  // Resources (44 people)
  const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
  const resourceDefs = [
    // Web Platform (10)
    { name: 'Alex Chen', title: 'Senior Full-Stack Developer', teamId: web.id, roleType: 'Developer', seniority: 'Senior', hireDate: '2021-03-15', hourlyCostRate: 95, skills: [{ name: 'React', proficiency: 5 }, { name: 'TypeScript', proficiency: 5 }, { name: 'Node.js', proficiency: 4 }, { name: 'AWS', proficiency: 3 }], email: 'alex.chen@acme.com' },
    { name: 'Sarah Johnson', title: 'Lead Frontend Developer', teamId: web.id, roleType: 'Developer', seniority: 'Lead', hireDate: '2020-01-10', hourlyCostRate: 110, skills: [{ name: 'React', proficiency: 5 }, { name: 'TypeScript', proficiency: 5 }, { name: 'GraphQL', proficiency: 4 }], email: 'sarah.j@acme.com' },
    { name: 'Mike Torres', title: 'Backend Developer', teamId: web.id, roleType: 'Developer', seniority: 'Mid', hireDate: '2022-06-01', hourlyCostRate: 75, skills: [{ name: 'Node.js', proficiency: 4 }, { name: 'TypeScript', proficiency: 3 }, { name: 'AWS', proficiency: 3 }], email: 'mike.t@acme.com' },
    { name: 'Emily Park', title: 'Junior Developer', teamId: web.id, roleType: 'Developer', seniority: 'Junior', hireDate: '2024-01-15', hourlyCostRate: 55, skills: [{ name: 'React', proficiency: 2 }, { name: 'TypeScript', proficiency: 2 }], email: 'emily.p@acme.com' },
    { name: 'David Kim', title: 'Solutions Architect', teamId: web.id, roleType: 'Architect', seniority: 'Senior', hireDate: '2019-08-20', hourlyCostRate: 120, skills: [{ name: 'AWS', proficiency: 5 }, { name: 'React', proficiency: 3 }, { name: 'GraphQL', proficiency: 4 }], email: 'david.k@acme.com' },
    { name: 'Lisa Wang', title: 'QA Engineer', teamId: web.id, roleType: 'QA', seniority: 'Mid', hireDate: '2022-03-01', hourlyCostRate: 70, skills: [{ name: 'Selenium', proficiency: 4 }, { name: 'TypeScript', proficiency: 3 }], email: 'lisa.w@acme.com' },
    // Business Applications (8)
    { name: 'James Wilson', title: 'Salesforce Architect', teamId: bizapps.id, roleType: 'Architect', seniority: 'Senior', hireDate: '2020-05-15', hourlyCostRate: 115, skills: [{ name: 'Salesforce', proficiency: 5 }, { name: 'ServiceNow', proficiency: 3 }], email: 'james.w@acme.com' },
    { name: 'Rachel Green', title: 'Business Analyst', teamId: bizapps.id, roleType: 'Business Analyst', seniority: 'Senior', hireDate: '2019-11-01', hourlyCostRate: 90, skills: [{ name: 'Power Platform', proficiency: 4 }, { name: 'SQL Server', proficiency: 3 }], email: 'rachel.g@acme.com' },
    { name: 'Tom Anderson', title: '.NET Developer', teamId: bizapps.id, roleType: 'Developer', seniority: 'Senior', hireDate: '2018-07-20', hourlyCostRate: 100, skills: [{ name: '.NET', proficiency: 5 }, { name: 'SQL Server', proficiency: 4 }], email: 'tom.a@acme.com' },
    { name: 'Nina Patel', title: 'Salesforce Developer', teamId: bizapps.id, roleType: 'Developer', seniority: 'Mid', hireDate: '2022-09-01', hourlyCostRate: 80, skills: [{ name: 'Salesforce', proficiency: 4 }, { name: 'ServiceNow', proficiency: 2 }], email: 'nina.p@acme.com' },
    { name: 'Carlos Mendez', title: 'QA Lead', teamId: bizapps.id, roleType: 'QA', seniority: 'Lead', hireDate: '2019-04-15', hourlyCostRate: 95, skills: [{ name: 'Selenium', proficiency: 4 }, { name: '.NET', proficiency: 2 }], email: 'carlos.m@acme.com' },
    // ERP & Supply Chain (10)
    { name: 'Maria Rodriguez', title: 'SAP Solutions Architect', teamId: erp.id, roleType: 'Architect', seniority: 'Principal', hireDate: '2017-01-10', hourlyCostRate: 145, skills: [{ name: 'SAP S/4HANA', proficiency: 5 }, { name: 'ABAP', proficiency: 5 }, { name: 'SAP BTP', proficiency: 4 }], email: 'maria.r@acme.com' },
    { name: 'Robert Chen', title: 'Senior ABAP Developer', teamId: erp.id, roleType: 'Developer', seniority: 'Senior', hireDate: '2019-06-01', hourlyCostRate: 105, skills: [{ name: 'ABAP', proficiency: 5 }, { name: 'SAP S/4HANA', proficiency: 4 }], email: 'robert.c@acme.com' },
    { name: 'Priya Sharma', title: 'SAP Functional Analyst', teamId: erp.id, roleType: 'Business Analyst', seniority: 'Senior', hireDate: '2020-02-15', hourlyCostRate: 95, skills: [{ name: 'SAP S/4HANA', proficiency: 4 }, { name: 'EDI', proficiency: 3 }], email: 'priya.s@acme.com' },
    { name: 'Kevin Lee', title: 'ERP Developer', teamId: erp.id, roleType: 'Developer', seniority: 'Mid', hireDate: '2022-01-10', hourlyCostRate: 80, skills: [{ name: 'ABAP', proficiency: 3 }, { name: 'SAP S/4HANA', proficiency: 3 }], email: 'kevin.l@acme.com' },
    { name: 'Jennifer Brown', title: 'ERP QA Engineer', teamId: erp.id, roleType: 'QA', seniority: 'Mid', hireDate: '2021-07-01', hourlyCostRate: 70, skills: [{ name: 'SAP S/4HANA', proficiency: 3 }], email: 'jennifer.b@acme.com' },
    { name: 'Daniel Park', title: 'DBA', teamId: erp.id, roleType: 'DBA', seniority: 'Senior', hireDate: '2018-11-15', hourlyCostRate: 100, skills: [{ name: 'Oracle', proficiency: 5 }, { name: 'SAP S/4HANA', proficiency: 3 }], email: 'daniel.p@acme.com' },
    // Data & Analytics (7)
    { name: 'Amanda Foster', title: 'Data Architect', teamId: data.id, roleType: 'Architect', seniority: 'Senior', hireDate: '2020-03-01', hourlyCostRate: 115, skills: [{ name: 'Snowflake', proficiency: 5 }, { name: 'dbt', proficiency: 4 }, { name: 'Python', proficiency: 4 }], email: 'amanda.f@acme.com' },
    { name: 'Chris Taylor', title: 'Data Engineer', teamId: data.id, roleType: 'Developer', seniority: 'Senior', hireDate: '2021-01-15', hourlyCostRate: 95, skills: [{ name: 'Python', proficiency: 5 }, { name: 'Spark', proficiency: 4 }, { name: 'Airflow', proficiency: 4 }], email: 'chris.t@acme.com' },
    { name: 'Sophie Liu', title: 'BI Developer', teamId: data.id, roleType: 'Developer', seniority: 'Mid', hireDate: '2022-05-01', hourlyCostRate: 75, skills: [{ name: 'Tableau', proficiency: 5 }, { name: 'Snowflake', proficiency: 3 }, { name: 'dbt', proficiency: 3 }], email: 'sophie.l@acme.com' },
    { name: 'Ryan Martinez', title: 'Junior Data Engineer', teamId: data.id, roleType: 'Developer', seniority: 'Junior', hireDate: '2024-03-01', hourlyCostRate: 55, skills: [{ name: 'Python', proficiency: 2 }, { name: 'Snowflake', proficiency: 2 }], email: 'ryan.m@acme.com' },
    // Infrastructure & Cloud (6)
    { name: 'Marcus Johnson', title: 'Cloud Architect', teamId: infraops.id, roleType: 'Architect', seniority: 'Senior', hireDate: '2019-09-01', hourlyCostRate: 120, skills: [{ name: 'AWS', proficiency: 5 }, { name: 'Terraform', proficiency: 5 }, { name: 'Kubernetes', proficiency: 4 }], email: 'marcus.j@acme.com' },
    { name: 'Anna White', title: 'DevOps Engineer', teamId: infraops.id, roleType: 'DevOps', seniority: 'Senior', hireDate: '2020-06-15', hourlyCostRate: 100, skills: [{ name: 'Kubernetes', proficiency: 5 }, { name: 'Terraform', proficiency: 4 }, { name: 'AWS', proficiency: 4 }], email: 'anna.w@acme.com' },
    { name: 'Jake Morrison', title: 'Infrastructure Engineer', teamId: infraops.id, roleType: 'DevOps', seniority: 'Mid', hireDate: '2021-11-01', hourlyCostRate: 80, skills: [{ name: 'Linux', proficiency: 4 }, { name: 'Networking', proficiency: 4 }, { name: 'Azure', proficiency: 3 }], email: 'jake.m@acme.com' },
    { name: 'Tina Lee', title: 'SRE', teamId: infraops.id, roleType: 'DevOps', seniority: 'Mid', hireDate: '2022-02-15', hourlyCostRate: 85, skills: [{ name: 'AWS', proficiency: 4 }, { name: 'Kubernetes', proficiency: 3 }, { name: 'Terraform', proficiency: 3 }], email: 'tina.l@acme.com' },
    // Cybersecurity (5)
    { name: 'Frank Nguyen', title: 'Security Architect', teamId: security.id, roleType: 'Architect', seniority: 'Senior', hireDate: '2019-04-01', hourlyCostRate: 125, skills: [{ name: 'Zero Trust', proficiency: 5 }, { name: 'IAM', proficiency: 5 }, { name: 'Compliance', proficiency: 4 }], email: 'frank.n@acme.com' },
    { name: 'Grace Kim', title: 'Security Engineer', teamId: security.id, roleType: 'Developer', seniority: 'Mid', hireDate: '2021-08-15', hourlyCostRate: 85, skills: [{ name: 'SIEM', proficiency: 4 }, { name: 'Penetration Testing', proficiency: 3 }, { name: 'IAM', proficiency: 3 }], email: 'grace.k@acme.com' },
    { name: 'Victor Adams', title: 'Compliance Analyst', teamId: security.id, roleType: 'Business Analyst', seniority: 'Mid', hireDate: '2022-01-10', hourlyCostRate: 75, skills: [{ name: 'Compliance', proficiency: 4 }, { name: 'SIEM', proficiency: 2 }], email: 'victor.a@acme.com' },
    // Mobile & Digital (6)
    { name: 'Diana Cruz', title: 'Mobile Lead', teamId: mobile.id, roleType: 'Developer', seniority: 'Lead', hireDate: '2020-02-01', hourlyCostRate: 110, skills: [{ name: 'React Native', proficiency: 5 }, { name: 'Swift', proficiency: 4 }, { name: 'Kotlin', proficiency: 4 }], email: 'diana.c@acme.com' },
    { name: 'Eric Wong', title: 'iOS Developer', teamId: mobile.id, roleType: 'Developer', seniority: 'Senior', hireDate: '2021-05-15', hourlyCostRate: 95, skills: [{ name: 'Swift', proficiency: 5 }, { name: 'React Native', proficiency: 3 }], email: 'eric.w@acme.com' },
    { name: 'Hannah Brooks', title: 'Android Developer', teamId: mobile.id, roleType: 'Developer', seniority: 'Mid', hireDate: '2022-03-01', hourlyCostRate: 80, skills: [{ name: 'Kotlin', proficiency: 4 }, { name: 'Flutter', proficiency: 3 }, { name: 'Firebase', proficiency: 3 }], email: 'hannah.b@acme.com' },
    { name: 'Ian Foster', title: 'Mobile QA', teamId: mobile.id, roleType: 'QA', seniority: 'Mid', hireDate: '2022-08-01', hourlyCostRate: 70, skills: [{ name: 'Appium', proficiency: 4 }, { name: 'React Native', proficiency: 2 }], email: 'ian.f@acme.com' },
  ];

  // Additional resources: part-time, contractor, new hire with ramp-up
  const extraResourceDefs = [
    // Part-time BA on BizApps
    { name: 'Laura Chen', title: 'Part-Time Business Analyst', teamId: bizapps.id, roleType: 'Business Analyst', seniority: 'Mid', hireDate: '2023-06-01', hourlyCostRate: 80, baseHoursPerWeek: 20, skills: [{ name: 'Power Platform', proficiency: 3 }, { name: 'SQL Server', proficiency: 2 }], email: 'laura.c@acme.com', notes: 'Works Mon/Tue/Wed only', trainingPct: 0 },
    // Part-time Dev on Data team (30 hrs)
    { name: 'Amir Hassan', title: 'Part-Time Data Analyst', teamId: data.id, roleType: 'Developer', seniority: 'Mid', hireDate: '2024-01-15', hourlyCostRate: 70, baseHoursPerWeek: 30, skills: [{ name: 'Python', proficiency: 3 }, { name: 'Tableau', proficiency: 4 }], email: 'amir.h@acme.com', notes: 'Reduced schedule - personal reasons', trainingPct: 0 },
    // Contractor with end date on ERP
    { name: 'Klaus Weber', title: 'SAP BTP Consultant', teamId: erp.id, roleType: 'Developer', seniority: 'Senior', hireDate: '2025-10-01', hourlyCostRate: 175, baseHoursPerWeek: 40, isContractor: true, endDate: '2026-06-30', skills: [{ name: 'SAP BTP', proficiency: 5 }, { name: 'SAP S/4HANA', proficiency: 4 }, { name: 'ABAP', proficiency: 4 }], email: 'klaus.w@deloitte.com', notes: 'Deloitte contractor for SAP migration', trainingPct: 0 },
    // New hire with ramp-up
    { name: 'Jordan Rivera', title: 'Cloud Engineer', teamId: infraops.id, roleType: 'DevOps', seniority: 'Mid', hireDate: '2026-02-03', hourlyCostRate: 85, baseHoursPerWeek: 40, rampUpWeeks: 8, rampUpStart: '2026-02-03', skills: [{ name: 'AWS', proficiency: 3 }, { name: 'Terraform', proficiency: 2 }, { name: 'Kubernetes', proficiency: 2 }], email: 'jordan.r@acme.com', notes: 'New hire - ramping up', trainingPct: 10 },
    // On-call DevOps
    { name: 'Pat O\'Brien', title: 'Senior SRE', teamId: infraops.id, roleType: 'DevOps', seniority: 'Senior', hireDate: '2020-04-15', hourlyCostRate: 105, baseHoursPerWeek: 40, onCallPct: 20, skills: [{ name: 'AWS', proficiency: 5 }, { name: 'Linux', proficiency: 5 }, { name: 'Kubernetes', proficiency: 4 }], email: 'pat.o@acme.com', notes: 'Primary on-call rotation', trainingPct: 5 },
    // Training-heavy junior
    { name: 'Zara Patel', title: 'Security Analyst', teamId: security.id, roleType: 'Developer', seniority: 'Junior', hireDate: '2025-09-15', hourlyCostRate: 55, baseHoursPerWeek: 40, trainingPct: 15, skills: [{ name: 'SIEM', proficiency: 2 }, { name: 'IAM', proficiency: 1 }], email: 'zara.p@acme.com', notes: 'In security certification program', rampUpWeeks: 8 },
  ];

  for (let i = 0; i < extraResourceDefs.length; i++) {
    const { skills, ...rest } = extraResourceDefs[i];
    await prisma.resource.create({
      data: {
        ...rest,
        skills: skills,
        ptoBlocks: (rest as any).isContractor ? [] : [
          ...(rest.name === 'Laura Chen' ? [{ startWeek: 15, endWeek: 16, reason: 'Personal' }] : []),
          ...(rest.name === 'Klaus Weber' ? [{ startWeek: 20, endWeek: 21, reason: 'Conference' }] : []),
        ],
        avatarColor: AVATAR_COLORS[(resourceDefs.length + i) % AVATAR_COLORS.length],
        orgId: org.id,
      } as any,
    });
  }

  for (let i = 0; i < resourceDefs.length; i++) {
    const { skills, ...rest } = resourceDefs[i];
    await prisma.resource.create({
      data: {
        ...rest,
        baseHoursPerWeek: 40,
        skills: skills,
        ptoBlocks: [
          ...(rest.name === 'Alex Chen' ? [{ startWeek: 10, endWeek: 12, reason: 'Vacation' }] : []),
          ...(rest.name === 'Sarah Johnson' ? [{ startWeek: 26, endWeek: 28, reason: 'Vacation' }, { startWeek: 48, endWeek: 49, reason: 'Personal' }] : []),
          ...(rest.name === 'Maria Rodriguez' ? [{ startWeek: 16, endWeek: 17, reason: 'Conference' }] : []),
          ...(rest.name === 'Chris Taylor' ? [{ startWeek: 30, endWeek: 42, reason: 'Parental Leave' }] : []),
          ...(rest.name === 'Anna White' ? [{ startWeek: 22, endWeek: 23, reason: 'Training' }] : []),
          ...(rest.name === 'Diana Cruz' ? [{ startWeek: 35, endWeek: 36, reason: 'Vacation' }] : []),
          ...(rest.name === 'Frank Nguyen' ? [{ startWeek: 5, endWeek: 5, reason: 'Sick' }] : []),
        ],
        avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
        orgId: org.id,
      },
    });
  }

  // Holidays (US Federal 2026)
  const holidays2026 = [
    { name: "New Year's Day", date: '2026-01-01', week: 1 },
    { name: 'MLK Day', date: '2026-01-19', week: 3 },
    { name: "Presidents' Day", date: '2026-02-16', week: 8 },
    { name: 'Memorial Day', date: '2026-05-25', week: 22 },
    { name: 'Juneteenth', date: '2026-06-19', week: 25 },
    { name: 'Independence Day', date: '2026-07-03', week: 27 },
    { name: 'Labor Day', date: '2026-09-07', week: 36 },
    { name: 'Columbus Day', date: '2026-10-12', week: 41 },
    { name: 'Veterans Day', date: '2026-11-11', week: 45 },
    { name: 'Thanksgiving', date: '2026-11-26', week: 48 },
    { name: 'Day After Thanksgiving', date: '2026-11-27', week: 48 },
    { name: 'Christmas Eve', date: '2026-12-24', week: 52 },
    { name: 'Christmas Day', date: '2026-12-25', week: 52 },
  ];
  await prisma.holiday.createMany({
    data: holidays2026.map(h => ({
      ...h, hoursOff: 8, recurring: true, holidaySet: 'US Federal', orgId: org.id,
    })),
  });

  // Enhanced PTO entries with new fields
  await prisma.pTOEntry.deleteMany({ where: { orgId: org.id } });
  await prisma.pTOEntry.createMany({
    data: [
      { teamId: web.id, role: 'developer', personName: 'Alex Chen', startDate: '2026-03-09', endDate: '2026-03-27', startWeek: 10, endWeek: 12, hoursPerDay: 8, hoursPerWeek: 40, ptoType: 'Vacation', status: 'Approved', reason: 'Vacation', notes: 'Spring break trip', orgId: org.id },
      { teamId: web.id, role: 'developer', personName: 'Sarah Johnson', startDate: '2026-06-29', endDate: '2026-07-17', startWeek: 26, endWeek: 28, hoursPerDay: 8, hoursPerWeek: 40, ptoType: 'Vacation', status: 'Planned', reason: 'Vacation', notes: 'Summer vacation', orgId: org.id },
      { teamId: erp.id, role: 'architect', personName: 'Maria Rodriguez', startDate: '2026-04-20', endDate: '2026-05-01', startWeek: 16, endWeek: 17, hoursPerDay: 8, hoursPerWeek: 40, ptoType: 'Training', status: 'Approved', reason: 'Conference', notes: 'SAP TechEd conference', orgId: org.id },
      { teamId: data.id, role: 'developer', personName: 'Chris Taylor', startDate: '2026-07-27', endDate: '2026-10-16', startWeek: 30, endWeek: 42, hoursPerDay: 8, hoursPerWeek: 40, ptoType: 'Parental Leave', status: 'Approved', reason: 'Parental Leave', notes: 'Paternity leave - 12 weeks', orgId: org.id },
      { teamId: infraops.id, role: 'devops', personName: 'Anna White', startDate: '2026-06-01', endDate: '2026-06-12', startWeek: 22, endWeek: 23, hoursPerDay: 8, hoursPerWeek: 40, ptoType: 'Training', status: 'Approved', reason: 'Training', notes: 'AWS re:Invent prep training', orgId: org.id },
      { teamId: mobile.id, role: 'developer', personName: 'Diana Cruz', startDate: '2026-08-31', endDate: '2026-09-11', startWeek: 35, endWeek: 36, hoursPerDay: 8, hoursPerWeek: 40, ptoType: 'Vacation', status: 'Planned', reason: 'Vacation', orgId: org.id },
      { teamId: security.id, role: 'architect', personName: 'Frank Nguyen', startDate: '2026-02-02', endDate: '2026-02-06', startWeek: 5, endWeek: 5, hoursPerDay: 8, hoursPerWeek: 40, ptoType: 'Sick', status: 'Taken', reason: 'Sick', orgId: org.id },
      { teamId: web.id, role: 'developer', personName: 'Emily Park', startDate: '2026-03-16', endDate: '2026-03-20', startWeek: 11, endWeek: 11, hoursPerDay: 4, hoursPerWeek: 20, ptoType: 'Personal', status: 'Approved', reason: 'Personal', notes: 'Half days - moving', orgId: org.id },
    ],
  });

  console.log(`✅ Seeded: 1 org, 2 users, ${teams.length} teams, ${projects.length} projects, ${estimateDefs.length} estimates, 3 scenarios, ${resourceDefs.length + extraResourceDefs.length} resources, ${holidays2026.length} holidays, 8 PTO entries`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
