import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Clean existing data
  console.log('Clearing existing data...')
  await prisma.auditLog.deleteMany()
  await prisma.actualEntry.deleteMany()
  await prisma.newHire.deleteMany()
  await prisma.pTOEntry.deleteMany()
  await prisma.holiday.deleteMany()
  await prisma.projectSkillRequirement.deleteMany()
  await prisma.resourceAssignment.deleteMany()
  await prisma.resource.deleteMany()
  await prisma.contractor.deleteMany()
  await prisma.priorityOverride.deleteMany()
  await prisma.teamEstimate.deleteMany()
  await prisma.scenario.deleteMany()
  await prisma.project.deleteMany()
  await prisma.team.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()

  // Create PetSafe Brands org
  console.log('Creating PetSafe Brands org...')
  const org = await prisma.organization.create({
    data: {
      name: 'PetSafe Brands',
      slug: 'petsafe-brands',
      fiscalYearStartMonth: 1,
      defaultHoursPerWeek: 40,
      capacityAmber: 75,
      capacityRed: 90,
      holidays: JSON.stringify([]),
      roleTemplates: JSON.stringify([
        'developer', 'qa', 'devops', 'dba', 'pm', 'ux',
        'architect', 'ba', 'scrumMaster', 'analyst', 'engineer',
        'admin', 'manager', 'director'
      ]),
    },
  })

  // Create admin user
  console.log('Creating admin user...')
  const passwordHash = await hash('password123', 12)
  await prisma.user.create({
    data: {
      email: 'admin@petsafe.com',
      name: 'Peter Schliesmann',
      passwordHash,
      role: 'OWNER',
      orgId: org.id,
    },
  })

  // Create teams
  console.log('Creating 6 teams...')
  const teamsData = [
    { name: 'BizApps', department: 'IT', costCenter: '7030', managerName: 'Kelley Deuso', location: 'Knoxville, TN', timezone: 'America/New_York' },
    { name: 'Salesforce', department: 'IT', costCenter: '7030', managerName: 'Kelley Deuso', location: 'Knoxville, TN', timezone: 'America/New_York' },
    { name: 'ERP', department: 'IT', costCenter: '7030', managerName: 'Kal Vayilapalli', location: 'Knoxville, TN', timezone: 'America/New_York' },
    { name: 'Security', department: 'IT', costCenter: '7030', managerName: 'Mike Stolarik', location: 'Knoxville, TN', timezone: 'America/New_York' },
    { name: 'InfraOps', department: 'IT', costCenter: '7030', managerName: 'Jacob Kilpatrick', location: 'Knoxville, TN', timezone: 'America/New_York' },
    { name: 'Data & Analytics', department: 'IT', costCenter: '7030', managerName: 'Brittany Bentley', location: 'Knoxville, TN', timezone: 'America/New_York' },
  ]

  const teams: Record<string, string> = {}
  for (const t of teamsData) {
    const team = await prisma.team.create({
      data: { ...t, orgId: org.id },
    })
    teams[t.name] = team.id
    console.log(`  ✓ ${t.name} (${t.managerName})`)
  }

  // Create US Federal 2026 holidays
  console.log('Creating 2026 US Federal holidays...')
  const holidays2026 = [
    { name: "New Year's Day", date: '2026-01-01', week: 1 },
    { name: 'MLK Jr. Day', date: '2026-01-19', week: 3 },
    { name: "Presidents' Day", date: '2026-02-16', week: 7 },
    { name: 'Memorial Day', date: '2026-05-25', week: 21 },
    { name: 'Independence Day', date: '2026-07-03', week: 27 },
    { name: 'Labor Day', date: '2026-09-07', week: 36 },
    { name: 'Columbus Day', date: '2026-10-12', week: 41 },
    { name: 'Veterans Day', date: '2026-11-11', week: 45 },
    { name: 'Thanksgiving', date: '2026-11-26', week: 47 },
    { name: 'Day After Thanksgiving', date: '2026-11-27', week: 47 },
    { name: 'Christmas Eve', date: '2026-12-24', week: 52 },
    { name: 'Christmas Day', date: '2026-12-25', week: 52 },
  ]

  for (const h of holidays2026) {
    await prisma.holiday.create({
      data: { ...h, hoursOff: 8, recurring: true, holidaySet: 'US Federal', orgId: org.id },
    })
  }

  // Set blended rate on org
  console.log('Setting blended rate and estimation config...')
  await prisma.organization.update({
    where: { id: org.id },
    data: {
      blendedRate: 95,
      estimationConfig: {
        percentages: { requirements: 5, technicalDesign: 5, testing: 33, support: 10 },
      },
    },
  })

  // Create sample projects with workflow statuses
  console.log('Creating sample projects with estimation data...')
  const projectsData = [
    { name: 'Salesforce CPQ Upgrade', priority: 1, status: 'active', workflowStatus: 'approved', sponsor: 'VP Sales', category: 'CRM', description: 'Upgrade CPQ module to latest version' },
    { name: 'EDI Integration', priority: 2, status: 'in_planning', workflowStatus: 'estimating', sponsor: 'VP Supply Chain', category: 'ERP', description: 'New EDI partner integrations' },
    { name: 'Data Lake Migration', priority: 3, status: 'not_started', workflowStatus: 'submitted', sponsor: 'CTO', category: 'Data', description: 'Migrate to cloud data lake' },
    { name: 'SSO Implementation', priority: 4, status: 'active', workflowStatus: 'cost_review', sponsor: 'CISO', category: 'Security', description: 'Enterprise SSO rollout' },
    { name: 'Mobile App v2', priority: 5, status: 'in_planning', workflowStatus: 'estimated', sponsor: 'VP Digital', category: 'Digital', description: 'Next-gen mobile app' },
  ]

  for (const p of projectsData) {
    const project = await prisma.project.create({
      data: { ...p, orgId: org.id },
    })

    // Add team estimates with dev hours
    const teamKeys = Object.keys(teams)
    const teamKey = teamKeys[Math.floor(Math.random() * teamKeys.length)]
    const devHours = [80, 200, 400, 120, 600][projectsData.indexOf(p)]

    await prisma.teamEstimate.create({
      data: {
        projectId: project.id,
        teamId: teams[teamKey],
        orgId: org.id,
        devHours: devHours,
        development: devHours,
        design: Math.round(devHours * 0.05),
        testing: Math.round(devHours * 0.33),
        deployment: Math.round(devHours * 0.05),
        postDeploy: Math.round(devHours * 0.1),
      },
    })

    console.log(`  ✓ ${p.name} (${p.workflowStatus}) - ${devHours}h dev`)
  }

  console.log('\n✅ PetSafe Brands seeded successfully!')
  console.log(`   Org: ${org.name} (${org.id})`)
  console.log(`   Login: admin@petsafe.com / password123`)
  console.log(`   Teams: ${Object.keys(teams).length}`)
  console.log('\n   Waiting for: Resources, Projects, Team Estimates data from Peter')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
