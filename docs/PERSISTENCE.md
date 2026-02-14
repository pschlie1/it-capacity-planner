# Persistence & Authentication Architecture

## Current Setup (v2 - SQLite)

The app uses **Prisma ORM** with **SQLite** for data persistence and **NextAuth** for authentication.

### Login Credentials (Demo)
- **Admin**: admin@acme.com / password123 (OWNER role)  
- **Viewer**: viewer@acme.com / password123 (VIEWER role)

### Architecture
```
Browser → NextAuth (JWT) → API Routes → requireAuth() → Service Layer → Prisma → SQLite
                                              ↓
                                     orgId tenant scoping
```

### Components
- **`prisma/schema.prisma`** — Full data model with multi-tenancy (orgId on every table)
- **`src/lib/auth.ts`** — NextAuth configuration (credentials provider, JWT sessions)
- **`src/lib/api-auth.ts`** — `requireAuth(minRole?)` helper for API routes
- **`src/lib/services/`** — Tenant-scoped service layer (teams, projects, scenarios, resources, settings, audit)
- **`src/lib/db.ts`** — Prisma client singleton
- **`prisma/seed.ts`** — Seed script with demo org, users, teams, projects, resources

### RBAC Roles
| Role | Permissions |
|------|------------|
| OWNER | Everything + org settings + user management |
| ADMIN | CRUD teams, projects, resources, scenarios + audit log |
| MEMBER | View all, edit assigned items |
| VIEWER | Read-only access |

### Multi-Tenancy
- Every table has `orgId` column
- Every service function takes `orgId` as first parameter
- `requireAuth()` extracts orgId from JWT session
- No cross-tenant data access possible through API

### Audit Logging
- All CREATE/UPDATE/DELETE operations logged to `AuditLog` table
- Viewable in Settings (ADMIN/OWNER only)
- Append-only — logs cannot be deleted

## Migrating to PostgreSQL

1. **Provision a Postgres database** (Neon, Supabase, Vercel Postgres)

2. **Update `prisma/schema.prisma`**:
   ```prisma
   datasource db {
     provider = "postgresql"  // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

3. **Update JSON fields** — Change `String` JSON fields to native `Json` type:
   - `Organization.holidays`, `roleTemplates`
   - `Team.skills`
   - `Project.requiredSkills`, `dependencies`, `milestones`, `actualHours`
   - `Resource.skills`, `ptoBlocks`
   - etc.

4. **Run migrations**:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. **Set env var on Vercel**:
   ```bash
   npx vercel env rm DATABASE_URL production
   echo "postgresql://..." | npx vercel env add DATABASE_URL production
   ```

6. **Add Row-Level Security** (optional, defense in depth):
   ```sql
   ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
   CREATE POLICY tenant_isolation ON "Team" 
     USING ("orgId" = current_setting('app.current_org_id'));
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | Prisma connection string | Yes |
| NEXTAUTH_SECRET | JWT signing secret | Yes (production) |
| NEXTAUTH_URL | App base URL | Yes (production) |
| OPENAI_API_KEY | For AI features | Optional |

## Vercel SQLite Limitation

On Vercel serverless, SQLite is **read-only** (the DB file is bundled but the filesystem is ephemeral). Data changes won't persist across function invocations. For full persistence, migrate to PostgreSQL.
