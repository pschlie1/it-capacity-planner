-- Row Level Security (RLS) Setup for IT Capacity Planner
-- ============================================================
--
-- HOW IT WORKS:
-- 1. RLS is enabled on all tables that have an orgId column.
-- 2. A PostgreSQL session variable `app.current_org_id` must be set
--    before executing queries (e.g., SET app.current_org_id = 'org_xxx').
-- 3. The policy restricts SELECT/INSERT/UPDATE/DELETE to rows where
--    orgId matches the session variable.
-- 4. The application should call SET at the start of each request
--    after authenticating the user and resolving their orgId.
--
-- USAGE:
--   psql $DATABASE_URL -f scripts/setup-rls.sql
--
-- NOTE: Prisma doesn't natively support RLS session variables.
--   Use prisma.$executeRawUnsafe(`SET app.current_org_id = '${orgId}'`)
--   before queries, or rely on application-level orgId filtering (current approach).
--   RLS adds defense-in-depth.

-- Helper: tables with orgId
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'User', 'Team', 'Project', 'TeamEstimate', 'Scenario',
    'PriorityOverride', 'Contractor', 'Resource', 'ResourceAssignment',
    'ProjectSkillRequirement', 'PTOEntry', 'Holiday', 'NewHire',
    'ActualEntry', 'AuditLog'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

    -- Drop existing policy if any
    EXECUTE format('DROP POLICY IF EXISTS org_isolation ON %I', tbl);

    -- Create policy: restrict all operations to matching orgId
    EXECUTE format(
      'CREATE POLICY org_isolation ON %I
       FOR ALL
       USING ("orgId" = current_setting(''app.current_org_id'', true))
       WITH CHECK ("orgId" = current_setting(''app.current_org_id'', true))',
      tbl
    );

    RAISE NOTICE 'RLS enabled on table: %', tbl;
  END LOOP;
END $$;

-- Organization table: isolate by id
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "Organization";
CREATE POLICY org_isolation ON "Organization"
  FOR ALL
  USING ("id" = current_setting('app.current_org_id', true))
  WITH CHECK ("id" = current_setting('app.current_org_id', true));

-- Ensure the app role is not a superuser (superusers bypass RLS)
-- In production, create a dedicated app role:
--   CREATE ROLE app_user LOGIN PASSWORD 'xxx';
--   GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user;
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_user;

SELECT 'RLS setup complete. Set app.current_org_id before queries.' AS status;
