# IT Capacity Planner — Roadmap to TECH-STACK.md Compliance

## Current State
The app is a functional prototype with AI-powered capacity planning features. It uses in-memory data stores, has no auth, no tests, and no CI/CD. Security basics have been added (this audit) but significant architectural gaps remain.

---

## Priority 1 — Must Fix (1-2 weeks)

### 1.1 Real Database (PostgreSQL + Prisma)
- **Gap:** App uses in-memory arrays (`store.ts`, `resource-store.ts`). All data lost on restart.
- **Fix:** Provision PostgreSQL (Supabase/Neon), migrate schema, replace in-memory stores with Prisma queries.
- **Effort:** 3-5 days
- **Why:** App is non-functional for real users without persistent data.

### 1.2 Authentication (NextAuth)
- **Gap:** `next-auth` is installed but not configured. App has zero auth — anyone can access everything.
- **Fix:** Configure NextAuth with email/OAuth provider, protect all routes.
- **Effort:** 1-2 days
- **Why:** Security baseline. Required before any real deployment.

### 1.3 Zod on CRUD Routes
- **Gap:** `/api/projects`, `/api/teams`, `/api/scenarios`, `/api/resources` routes have no input validation.
- **Fix:** Apply schemas from `src/lib/schemas.ts` to all remaining API routes.
- **Effort:** 1 day
- **Why:** Prevents data corruption and injection attacks.

### 1.4 CI/CD Pipeline
- **Gap:** No `.github/workflows/`. No automated checks.
- **Fix:** Add GitHub Actions for lint, typecheck, build, test.
- **Effort:** 0.5 day
- **Why:** Prevents regression, enforces quality gates.

---

## Priority 2 — Should Fix (2-4 weeks)

### 2.1 Testing Foundation
- **Gap:** Zero tests. Target is 80% coverage.
- **Fix:** Add Vitest, write unit tests for allocation engine and API routes, add Playwright for E2E.
- **Effort:** 3-5 days for foundation, ongoing for coverage
- **Why:** No regression safety net exists.

### 2.2 Code Splitting / Performance
- **Gap:** Entire app (257 kB) loads on first visit. Recharts bundled inline.
- **Fix:** Dynamic import charts, split tabs into lazy-loaded routes.
- **Effort:** 1-2 days
- **Why:** Slow initial load, especially on mobile.

### 2.3 Clean Up `any` Types
- **Gap:** 12 `any` usages in AI routes.
- **Fix:** Define proper types for AI context data, OpenAI responses.
- **Effort:** 0.5 day
- **Why:** TypeScript strict mode is on but weakened by `any` casts.

### 2.4 Structured Logging
- **Gap:** Using `console.error` only.
- **Fix:** Add structured JSON logging with request_id propagation.
- **Effort:** 1 day
- **Why:** Can't debug production issues without proper logging.

### 2.5 Error Tracking (Sentry)
- **Gap:** No error tracking.
- **Fix:** Install `@sentry/nextjs`, configure DSN.
- **Effort:** 0.5 day
- **Why:** Errors in production go unnoticed.

---

## Priority 3 — Nice to Have (1-2 months)

### 3.1 Multi-tenancy + RLS
- **Gap:** No tenant isolation. Single-tenant only.
- **Fix:** Add `tenant_id` to all tables, configure PostgreSQL RLS.
- **Effort:** 3-5 days
- **Why:** Required for SaaS but not for single-org use.

### 3.2 RBAC
- **Gap:** No role-based access control.
- **Fix:** Implement role-to-permissions mapping (owner, admin, member, viewer).
- **Effort:** 2-3 days
- **Why:** Needed when multiple users exist.

### 3.3 Prompt Injection Mitigation
- **Gap:** User input interpolated directly into AI prompts.
- **Fix:** Sanitize/escape user inputs, add system prompt boundaries.
- **Effort:** 1 day
- **Why:** Prevents prompt manipulation attacks on AI features.

### 3.4 Switch to pnpm
- **Gap:** Using npm.
- **Fix:** Delete `package-lock.json`, run `pnpm import`, add `pnpm-lock.yaml`.
- **Effort:** 0.5 day
- **Why:** Standard compliance, faster installs.

### 3.5 ADRs & Runbooks
- **Gap:** No documentation.
- **Fix:** Write ADRs for stack choices, data architecture, AI integration.
- **Effort:** 1-2 days
- **Why:** Team knowledge preservation.

### 3.6 Redis + Job Queue
- **Gap:** AI requests are synchronous and block the request handler.
- **Fix:** Add BullMQ for long-running AI operations.
- **Effort:** 2-3 days
- **Why:** AI calls can take 10-30s; should be async with polling.

---

## Compliance Score

| Category | Score | Notes |
|----------|-------|-------|
| TypeScript | 7/10 | Strict mode on, but `any` usage |
| Security | 5/10 | Headers + rate limiting added, no auth/CSRF |
| Performance | 4/10 | No code splitting, large bundle |
| Architecture | 3/10 | In-memory stores, no proper data layer |
| UI/UX | 6/10 | Functional but missing polish |
| Testing | 0/10 | Zero tests |
| Observability | 1/10 | Console only |
| CI/CD | 0/10 | Nothing |
| **Overall** | **3/10** | Prototype quality, not production-ready |

---

*Generated: 2026-02-14*
