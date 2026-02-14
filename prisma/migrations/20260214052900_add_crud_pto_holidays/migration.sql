-- AlterTable
ALTER TABLE "PTOEntry" ADD COLUMN     "endDate" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "hoursPerDay" DOUBLE PRECISION NOT NULL DEFAULT 8,
ADD COLUMN     "notes" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ptoType" TEXT NOT NULL DEFAULT 'Vacation',
ADD COLUMN     "resourceId" TEXT,
ADD COLUMN     "startDate" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Planned';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "estimatedRoi" TEXT,
ADD COLUMN     "riskMitigation" TEXT,
ADD COLUMN     "statusHistory" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "strategicNotes" TEXT,
ADD COLUMN     "targetEndDate" TEXT,
ADD COLUMN     "targetStartDate" TEXT;

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "annualSalary" DOUBLE PRECISION,
ADD COLUMN     "employeeId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "endDate" TEXT,
ADD COLUMN     "isContractor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "onCallPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "rampUpStart" TEXT,
ADD COLUMN     "rampUpWeeks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trainingPct" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "costCenter" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "department" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "location" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "managerName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/New_York';

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "hoursOff" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "recurring" BOOLEAN NOT NULL DEFAULT true,
    "holidaySet" TEXT NOT NULL DEFAULT 'US Federal',
    "orgId" TEXT NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Holiday_orgId_idx" ON "Holiday"("orgId");

-- CreateIndex
CREATE INDEX "PTOEntry_resourceId_idx" ON "PTOEntry"("resourceId");

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
