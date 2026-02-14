-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fiscalYearStartMonth" INTEGER NOT NULL DEFAULT 1,
    "defaultHoursPerWeek" INTEGER NOT NULL DEFAULT 40,
    "capacityAmber" INTEGER NOT NULL DEFAULT 75,
    "capacityRed" INTEGER NOT NULL DEFAULT 90,
    "holidays" JSONB NOT NULL DEFAULT '[]',
    "roleTemplates" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pmFte" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "productManagerFte" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uxDesignerFte" DOUBLE PRECISION,
    "businessAnalystFte" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scrumMasterFte" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "architectFte" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "developerFte" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qaFte" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "devopsFte" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dbaFte" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kloTlmHoursPerWeek" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adminPct" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "skills" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "startWeekOffset" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "tshirtSize" TEXT,
    "category" TEXT,
    "sponsor" TEXT,
    "businessValue" TEXT,
    "requiredSkills" JSONB NOT NULL DEFAULT '[]',
    "dependencies" JSONB NOT NULL DEFAULT '[]',
    "milestones" JSONB NOT NULL DEFAULT '[]',
    "actualHours" JSONB NOT NULL DEFAULT '{}',
    "quarterTarget" TEXT,
    "riskLevel" TEXT,
    "riskNotes" TEXT,
    "committedDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamEstimate" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "design" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "development" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "testing" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deployment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "postDeploy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roleBreakdown" JSONB NOT NULL DEFAULT '{}',
    "confidence" TEXT,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "TeamEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriorityOverride" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "PriorityOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contractor" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "roleKey" TEXT NOT NULL,
    "fte" DOUBLE PRECISION NOT NULL,
    "weeks" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "startWeek" INTEGER NOT NULL DEFAULT 0,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "Contractor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "roleType" TEXT NOT NULL,
    "seniority" TEXT NOT NULL,
    "hireDate" TEXT NOT NULL,
    "hourlyCostRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "baseHoursPerWeek" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "skills" JSONB NOT NULL DEFAULT '[]',
    "ptoBlocks" JSONB NOT NULL DEFAULT '[]',
    "avatarColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "email" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orgId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceAssignment" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "allocationPct" DOUBLE PRECISION NOT NULL,
    "startWeek" INTEGER NOT NULL,
    "endWeek" INTEGER NOT NULL,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "ResourceAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSkillRequirement" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "minProficiency" INTEGER NOT NULL,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "ProjectSkillRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PTOEntry" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "startWeek" INTEGER NOT NULL,
    "endWeek" INTEGER NOT NULL,
    "hoursPerWeek" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "PTOEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewHire" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "startWeek" INTEGER NOT NULL,
    "rampWeeks" INTEGER NOT NULL,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "NewHire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActualEntry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "ActualEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_orgId_idx" ON "User"("orgId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Team_orgId_idx" ON "Team"("orgId");

-- CreateIndex
CREATE INDEX "Project_orgId_idx" ON "Project"("orgId");

-- CreateIndex
CREATE INDEX "Project_orgId_priority_idx" ON "Project"("orgId", "priority");

-- CreateIndex
CREATE INDEX "TeamEstimate_orgId_idx" ON "TeamEstimate"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamEstimate_projectId_teamId_key" ON "TeamEstimate"("projectId", "teamId");

-- CreateIndex
CREATE INDEX "Scenario_orgId_idx" ON "Scenario"("orgId");

-- CreateIndex
CREATE INDEX "PriorityOverride_orgId_idx" ON "PriorityOverride"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "PriorityOverride_scenarioId_projectId_key" ON "PriorityOverride"("scenarioId", "projectId");

-- CreateIndex
CREATE INDEX "Contractor_orgId_idx" ON "Contractor"("orgId");

-- CreateIndex
CREATE INDEX "Resource_orgId_idx" ON "Resource"("orgId");

-- CreateIndex
CREATE INDEX "Resource_teamId_idx" ON "Resource"("teamId");

-- CreateIndex
CREATE INDEX "ResourceAssignment_orgId_idx" ON "ResourceAssignment"("orgId");

-- CreateIndex
CREATE INDEX "ResourceAssignment_resourceId_idx" ON "ResourceAssignment"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceAssignment_projectId_idx" ON "ResourceAssignment"("projectId");

-- CreateIndex
CREATE INDEX "ProjectSkillRequirement_orgId_idx" ON "ProjectSkillRequirement"("orgId");

-- CreateIndex
CREATE INDEX "ProjectSkillRequirement_projectId_idx" ON "ProjectSkillRequirement"("projectId");

-- CreateIndex
CREATE INDEX "PTOEntry_orgId_idx" ON "PTOEntry"("orgId");

-- CreateIndex
CREATE INDEX "NewHire_orgId_idx" ON "NewHire"("orgId");

-- CreateIndex
CREATE INDEX "ActualEntry_orgId_idx" ON "ActualEntry"("orgId");

-- CreateIndex
CREATE INDEX "ActualEntry_projectId_idx" ON "ActualEntry"("projectId");

-- CreateIndex
CREATE INDEX "AuditLog_orgId_idx" ON "AuditLog"("orgId");

-- CreateIndex
CREATE INDEX "AuditLog_orgId_entity_idx" ON "AuditLog"("orgId", "entity");

-- CreateIndex
CREATE INDEX "AuditLog_orgId_createdAt_idx" ON "AuditLog"("orgId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamEstimate" ADD CONSTRAINT "TeamEstimate_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamEstimate" ADD CONSTRAINT "TeamEstimate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamEstimate" ADD CONSTRAINT "TeamEstimate_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriorityOverride" ADD CONSTRAINT "PriorityOverride_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriorityOverride" ADD CONSTRAINT "PriorityOverride_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriorityOverride" ADD CONSTRAINT "PriorityOverride_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contractor" ADD CONSTRAINT "Contractor_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contractor" ADD CONSTRAINT "Contractor_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contractor" ADD CONSTRAINT "Contractor_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAssignment" ADD CONSTRAINT "ResourceAssignment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAssignment" ADD CONSTRAINT "ResourceAssignment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAssignment" ADD CONSTRAINT "ResourceAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSkillRequirement" ADD CONSTRAINT "ProjectSkillRequirement_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSkillRequirement" ADD CONSTRAINT "ProjectSkillRequirement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PTOEntry" ADD CONSTRAINT "PTOEntry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PTOEntry" ADD CONSTRAINT "PTOEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewHire" ADD CONSTRAINT "NewHire_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewHire" ADD CONSTRAINT "NewHire_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActualEntry" ADD CONSTRAINT "ActualEntry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActualEntry" ADD CONSTRAINT "ActualEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActualEntry" ADD CONSTRAINT "ActualEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
