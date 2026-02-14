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

  console.log('\n✅ PetSafe Brands seeded successfully!')
  console.log(`   Org: ${org.name} (${org.id})`)
  console.log(`   Login: admin@petsafe.com / password123`)
  console.log(`   Teams: ${Object.keys(teams).length}`)
  console.log('\n   Waiting for: Resources, Projects, Team Estimates data from Peter')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
