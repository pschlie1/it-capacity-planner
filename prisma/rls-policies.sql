-- Row-Level Security Policies for IT Capacity Planner
-- Apply these after migrations to enforce tenant isolation at the DB level.
-- Note: Prisma doesn't support RLS natively, so apply via psql or Neon SQL Editor.

-- Enable RLS on all tenant-scoped tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Resource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamEstimate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Scenario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriorityOverride" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contractor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ResourceAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectSkillRequirement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PTOEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NewHire" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActualEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies require setting current_setting('app.org_id') per request.
-- Since Prisma doesn't support this natively, these policies are documented
-- for future implementation when moving to direct SQL or Prisma with middleware.
--
-- Example policy (apply per table):
-- CREATE POLICY tenant_isolation ON "Team"
--   USING ("orgId" = current_setting('app.org_id')::text);
