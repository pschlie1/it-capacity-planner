import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.contractor.deleteMany();
  await prisma.priorityOverride.deleteMany();
  await prisma.scenario.deleteMany();
  await prisma.teamEstimate.deleteMany();
  await prisma.project.deleteMany();
  await prisma.team.deleteMany();

  // Create Teams
  const web = await prisma.team.create({
    data: {
      name: 'Web Development',
      architectFte: 0.5, developerFte: 3.0, qaFte: 1.0, devopsFte: 0.5,
      businessAnalystFte: 0.5, pmFte: 0, productManagerFte: 0.5,
      kloTlmHoursPerWeek: 15, adminPct: 25,
    },
  });

  const bizapps = await prisma.team.create({
    data: {
      name: 'BizApps',
      architectFte: 0.5, developerFte: 2.5, qaFte: 1.0, devopsFte: 0.5,
      businessAnalystFte: 1.0, pmFte: 0.5,
      kloTlmHoursPerWeek: 20, adminPct: 25,
    },
  });

  const erp = await prisma.team.create({
    data: {
      name: 'ERP',
      architectFte: 1.0, developerFte: 4.0, qaFte: 1.5, devopsFte: 1.0,
      businessAnalystFte: 1.0, dbaFte: 0.5, pmFte: 0.5,
      kloTlmHoursPerWeek: 30, adminPct: 20,
    },
  });

  const dataAnalytics = await prisma.team.create({
    data: {
      name: 'Data & Analytics',
      architectFte: 0.5, developerFte: 2.0, qaFte: 0.5, devopsFte: 0.5,
      dbaFte: 1.0, businessAnalystFte: 0.5,
      kloTlmHoursPerWeek: 12, adminPct: 25,
    },
  });

  const infraops = await prisma.team.create({
    data: {
      name: 'InfraOps',
      architectFte: 0.5, developerFte: 1.5, devopsFte: 2.0, qaFte: 0.5,
      kloTlmHoursPerWeek: 40, adminPct: 20,
    },
  });

  const security = await prisma.team.create({
    data: {
      name: 'Security',
      architectFte: 0.5, developerFte: 1.0, qaFte: 0.5, devopsFte: 0.5,
      kloTlmHoursPerWeek: 15, adminPct: 25,
    },
  });

  // Create Projects
  const projects = [
    { name: 'Customer Portal Redesign', priority: 1, status: 'active', description: 'Complete overhaul of customer-facing portal with modern UX, SSO integration, and self-service capabilities.' },
    { name: 'ERP Cloud Migration', priority: 2, status: 'proposed', description: 'Migrate on-premise ERP system to cloud infrastructure with zero downtime.' },
    { name: 'Data Warehouse Modernization', priority: 3, status: 'proposed', description: 'Replace legacy data warehouse with modern lakehouse architecture for real-time analytics.' },
    { name: 'Zero Trust Security Implementation', priority: 4, status: 'proposed', description: 'Implement zero trust network architecture across all IT systems.' },
    { name: 'Mobile App Platform', priority: 5, status: 'proposed', description: 'Build cross-platform mobile application framework for internal and external apps.' },
    { name: 'API Gateway & Microservices', priority: 6, status: 'proposed', description: 'Deploy enterprise API gateway and begin decomposing monolithic services.' },
    { name: 'AI/ML Operations Platform', priority: 7, status: 'proposed', description: 'Stand up MLOps infrastructure for model training, deployment, and monitoring.' },
    { name: 'Legacy System Decommission', priority: 8, status: 'proposed', description: 'Retire 3 legacy applications and migrate remaining users to modern alternatives.' },
    { name: 'Compliance Automation', priority: 9, status: 'proposed', description: 'Automate SOX and SOC2 compliance reporting and evidence collection.' },
    { name: 'Employee Experience Portal', priority: 10, status: 'proposed', description: 'Unified internal portal for HR, IT requests, knowledge base, and onboarding.' },
  ];

  const createdProjects = [];
  for (const p of projects) {
    createdProjects.push(await prisma.project.create({ data: p }));
  }

  // Team Estimates - realistic hours per phase
  const estimates = [
    // Customer Portal Redesign - Web heavy, Security touch
    { projectIdx: 0, teamId: web.id, design: 80, development: 320, testing: 120, deployment: 24, postDeploy: 40 },
    { projectIdx: 0, teamId: security.id, design: 16, development: 40, testing: 24, deployment: 8, postDeploy: 8 },
    // ERP Cloud Migration - ERP heavy, InfraOps, Security
    { projectIdx: 1, teamId: erp.id, design: 120, development: 480, testing: 200, deployment: 80, postDeploy: 120 },
    { projectIdx: 1, teamId: infraops.id, design: 40, development: 160, testing: 60, deployment: 40, postDeploy: 40 },
    { projectIdx: 1, teamId: security.id, design: 24, development: 40, testing: 32, deployment: 16, postDeploy: 16 },
    // Data Warehouse - Data & Analytics, InfraOps
    { projectIdx: 2, teamId: dataAnalytics.id, design: 80, development: 280, testing: 100, deployment: 40, postDeploy: 60 },
    { projectIdx: 2, teamId: infraops.id, design: 24, development: 80, testing: 24, deployment: 24, postDeploy: 16 },
    // Zero Trust - Security heavy, InfraOps
    { projectIdx: 3, teamId: security.id, design: 60, development: 120, testing: 80, deployment: 40, postDeploy: 40 },
    { projectIdx: 3, teamId: infraops.id, design: 40, development: 120, testing: 40, deployment: 32, postDeploy: 24 },
    // Mobile App - Web, BizApps
    { projectIdx: 4, teamId: web.id, design: 60, development: 240, testing: 100, deployment: 24, postDeploy: 40 },
    { projectIdx: 4, teamId: bizapps.id, design: 40, development: 160, testing: 60, deployment: 16, postDeploy: 24 },
    // API Gateway - Web, BizApps, InfraOps
    { projectIdx: 5, teamId: web.id, design: 40, development: 160, testing: 60, deployment: 24, postDeploy: 24 },
    { projectIdx: 5, teamId: bizapps.id, design: 24, development: 120, testing: 40, deployment: 16, postDeploy: 16 },
    { projectIdx: 5, teamId: infraops.id, design: 24, development: 80, testing: 24, deployment: 16, postDeploy: 8 },
    // AI/ML Platform - Data & Analytics, InfraOps
    { projectIdx: 6, teamId: dataAnalytics.id, design: 60, development: 200, testing: 80, deployment: 32, postDeploy: 40 },
    { projectIdx: 6, teamId: infraops.id, design: 16, development: 60, testing: 16, deployment: 16, postDeploy: 8 },
    // Legacy Decommission - BizApps, ERP
    { projectIdx: 7, teamId: bizapps.id, design: 24, development: 120, testing: 60, deployment: 24, postDeploy: 40 },
    { projectIdx: 7, teamId: erp.id, design: 40, development: 160, testing: 80, deployment: 40, postDeploy: 60 },
    // Compliance Automation - Security, BizApps
    { projectIdx: 8, teamId: security.id, design: 32, development: 80, testing: 40, deployment: 16, postDeploy: 16 },
    { projectIdx: 8, teamId: bizapps.id, design: 16, development: 60, testing: 24, deployment: 8, postDeploy: 8 },
    // Employee Experience Portal - Web, BizApps
    { projectIdx: 9, teamId: web.id, design: 40, development: 200, testing: 80, deployment: 16, postDeploy: 24 },
    { projectIdx: 9, teamId: bizapps.id, design: 24, development: 100, testing: 40, deployment: 16, postDeploy: 16 },
  ];

  for (const e of estimates) {
    await prisma.teamEstimate.create({
      data: {
        projectId: createdProjects[e.projectIdx].id,
        teamId: e.teamId,
        design: e.design,
        development: e.development,
        testing: e.testing,
        deployment: e.deployment,
        postDeploy: e.postDeploy,
      },
    });
  }

  // Create default scenario
  await prisma.scenario.create({
    data: {
      name: 'Baseline',
      locked: false,
    },
  });

  // Create an optimistic scenario with a contractor
  const optimistic = await prisma.scenario.create({
    data: {
      name: 'Optimistic - QA Augmentation',
      locked: false,
    },
  });

  await prisma.contractor.create({
    data: {
      scenarioId: optimistic.id,
      teamId: erp.id,
      roleKey: 'qa',
      fte: 1.0,
      weeks: 26,
      label: 'Contract QA - ERP Migration',
      startWeek: 4,
    },
  });

  console.log('Seed data created successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
