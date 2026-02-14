-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "pmFte" REAL NOT NULL DEFAULT 0,
    "productManagerFte" REAL NOT NULL DEFAULT 0,
    "uxDesignerFte" REAL,
    "businessAnalystFte" REAL NOT NULL DEFAULT 0,
    "scrumMasterFte" REAL NOT NULL DEFAULT 0,
    "architectFte" REAL NOT NULL DEFAULT 0,
    "developerFte" REAL NOT NULL DEFAULT 0,
    "qaFte" REAL NOT NULL DEFAULT 0,
    "devopsFte" REAL NOT NULL DEFAULT 0,
    "dbaFte" REAL NOT NULL DEFAULT 0,
    "kloTlmHoursPerWeek" REAL NOT NULL DEFAULT 0,
    "adminPct" REAL NOT NULL DEFAULT 25,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "startWeekOffset" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TeamEstimate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "design" REAL NOT NULL DEFAULT 0,
    "development" REAL NOT NULL DEFAULT 0,
    "testing" REAL NOT NULL DEFAULT 0,
    "deployment" REAL NOT NULL DEFAULT 0,
    "postDeploy" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "TeamEstimate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamEstimate_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PriorityOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    CONSTRAINT "PriorityOverride_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PriorityOverride_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contractor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "roleKey" TEXT NOT NULL,
    "fte" REAL NOT NULL,
    "weeks" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "startWeek" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Contractor_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contractor_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamEstimate_projectId_teamId_key" ON "TeamEstimate"("projectId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "PriorityOverride_scenarioId_projectId_key" ON "PriorityOverride"("scenarioId", "projectId");
