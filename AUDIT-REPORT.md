# IT Capacity Planner — Audit Report

**Date:** 2026-02-14  
**Auditor:** Automated (against TECH-STACK.md standards)  
**Verdict:** ⚠️ Significant gaps — security fixes applied, architectural gaps remain

---

## 1. TypeScript Strictness

| Check | Status |
|-------|--------|
| `strict: true` in tsconfig.json | ✅ Yes |
| `ignoreBuildErrors` | ✅ Not set |
| `any` types | ⚠️ **12 instances** across AI routes |

**Details:** Most `any` usages are in API route handlers for OpenAI types and data mapping callbacks. Not critical but violates strict typing principles.

---

## 2. Security

### 2.1 Input Validation
| Route | Zod Validation | Status |
|-------|---------------|--------|
| `/api/ai/chat` | ✅ Added | **FIXED** |
| `/api/ai/forecast` | ✅ Added | **FIXED** |
| `/api/ai/intake` | ✅ Added | **FIXED** |
| `/api/ai/optimize` | ✅ Added | **FIXED** |
| `/api/ai/scenario` | ✅ Added | **FIXED** |
| `/api/ai/route` | ⚠️ Rate limited only | Partial |
| `/api/ai/briefing` | ✅ Rate limited (no body) | **FIXED** |
| `/api/ai/review` | ✅ Rate limited (no body) | **FIXED** |
| `/api/ai/insights` | ✅ Rate limited | **FIXED** |
| `/api/projects` | ❌ No validation | GAP |
| `/api/teams` | ❌ No validation | GAP |
| `/api/scenarios` | ❌ No validation | GAP |
| `/api/resources` | ❌ No validation | GAP |

### 2.2 API Key Exposure
✅ **SAFE** — `OPENAI_API_KEY` is only accessed via `process.env` in server-side route handlers. No `NEXT_PUBLIC_` prefix used for secrets.

### 2.3 Rate Limiting
✅ **FIXED** — All AI endpoints now have in-memory rate limiting (20 req/min/IP). CRUD routes remain unprotected.

### 2.4 Security Headers
✅ **FIXED** — Added via `next.config.mjs`:
- Content-Security-Policy
- Strict-Transport-Security  
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

### 2.5 Error Handling
⚠️ **PARTIALLY FIXED** — AI chat route previously leaked `error.message` to client. Fixed to use generic error responses. Other routes still expose some error details.

### 2.6 Prompt Injection Risk
⚠️ **GAP** — User input (`description`, `resourceName`, chat messages) is interpolated directly into system prompts. No sanitization or prompt injection mitigation. The `forecast` attrition prompt directly interpolates `resourceName` into the prompt string.

### 2.7 CSRF Protection
❌ **MISSING** — No CSRF tokens. Mitigated partially by API being JSON-only (browsers don't send JSON cross-origin by default with simple requests).

---

## 3. Performance

| Metric | Value | Assessment |
|--------|-------|------------|
| Main page First Load JS | **257 kB** | ⚠️ Heavy — Recharts bundled inline |
| Shared JS | 87.5 kB | Acceptable |
| Code splitting | ❌ None | Recharts should be lazy loaded |
| `"use client"` overuse | ⚠️ All components are client-side | Single SPA pattern, not using RSC |
| Image optimization | N/A | No images used |

### Bundle Breakdown
- The entire app is a single page (`/`) at 170 kB — all components, all charts, all features loaded at once
- Recharts (~50-60 kB) should be dynamically imported
- 6 chart components loaded regardless of which tab user views

---

## 4. Architecture

### File Structure vs Standard
| Standard | Actual | Status |
|----------|--------|--------|
| `app/(marketing)/` | Not used | ❌ |
| `app/(auth)/` | Not used | ❌ |
| `app/(app)/` | Not used | ❌ |
| `src/server/services/` | Not used | ❌ |
| `src/lib/` | ✅ Used | ✅ |
| `src/components/ui/` | ✅ shadcn card | ✅ |
| `packages/schemas/` | Not used | ❌ (schemas in `src/lib/schemas.ts` now) |
| `prisma/` | ✅ Exists but unused at runtime | ⚠️ |
| `tests/` | ❌ Missing | ❌ |
| `docs/adr/` | ❌ Missing | ❌ |
| `.github/workflows/` | ❌ Missing | ❌ |

### Data Layer Problem
**Critical architectural issue:** The app has Prisma + SQLite schema defined but **doesn't use it at runtime**. Instead, `src/lib/store.ts` and `src/lib/resource-store.ts` are **in-memory stores** using plain arrays. All data is lost on every deployment/restart. This is fundamentally incompatible with production use.

### Separation of Concerns
⚠️ Business logic (allocation engine, AI context building) is reasonably separated into `src/lib/`. However, API routes contain significant logic that should be in service files.

---

## 5. UI/UX

| Principle | Status |
|-----------|--------|
| 5-second test | ✅ Dashboard is clear |
| One primary action per screen | ✅ Tab-based navigation works |
| Empty states | ⚠️ Tables have basic empty states from seed data |
| Error handling in UI | ⚠️ AI features show demo mode fallback, but no error boundaries |
| Accessibility | ⚠️ Basic — no explicit ARIA labels on custom components |
| Mobile responsive | ⚠️ Uses Tailwind responsive classes but not thoroughly tested |
| Error Boundary | ✅ **ADDED** — `ErrorBoundary` component created |

---

## 6. Testing

| Check | Status |
|-------|--------|
| Test files exist | ❌ **ZERO** |
| Test framework configured | ❌ No Vitest/Jest |
| Coverage | ❌ **0%** (target: 80%) |
| E2E tests | ❌ No Playwright |

---

## 7. Compliance vs TECH-STACK.md

| Requirement | Status | Gap |
|-------------|--------|-----|
| pnpm | ❌ Using npm | Minor |
| PostgreSQL | ❌ SQLite schema + in-memory store | **CRITICAL** |
| Prisma (actually used) | ❌ Defined but unused | **CRITICAL** |
| tRPC or validated REST | ⚠️ REST, now partially validated | Moderate |
| Zod validation | ⚠️ AI routes done, CRUD routes pending | Moderate |
| Auth (NextAuth) | ❌ Package installed but not configured | **HIGH** |
| RBAC | ❌ Missing | HIGH |
| Rate limiting | ✅ AI routes done | Partial |
| Structured logging | ❌ Using console.error | Moderate |
| Error tracking (Sentry) | ❌ Missing | Moderate |
| CI/CD (.github/workflows) | ❌ Missing | HIGH |
| ADRs | ❌ Missing | Low |
| Runbooks | ❌ Missing | Low |
| Redis/BullMQ | ❌ Missing | Low (not needed yet) |
| Multi-tenancy/RLS | ❌ Missing | HIGH |
| OpenTelemetry | ❌ Missing | Low |

---

## What Was Fixed (This Audit)

### P0 — Security
1. ✅ Zod validation on all AI API routes (5 routes)
2. ✅ Rate limiting on all AI endpoints (8 routes, 20 req/min/IP)
3. ✅ Security headers (CSP, HSTS, X-Frame-Options, etc.)
4. ✅ Verified API keys are server-side only
5. ✅ Safe error responses (no stack traces leaked)
6. ✅ Error boundary component created

### P1 — Quality
1. ✅ Created shared Zod schemas (`src/lib/schemas.ts`)
2. ✅ Created API utility library (`src/lib/api-utils.ts`)

### Files Changed
- `next.config.mjs` — Security headers
- `src/lib/api-utils.ts` — NEW: Rate limiting, validation helpers, safe errors
- `src/lib/schemas.ts` — NEW: Zod schemas for all AI routes
- `src/components/ErrorBoundary.tsx` — NEW: React error boundary
- `src/app/api/ai/chat/route.ts` — Zod + rate limit + safe errors
- `src/app/api/ai/forecast/route.ts` — Zod + rate limit + safe errors
- `src/app/api/ai/intake/route.ts` — Zod + rate limit
- `src/app/api/ai/optimize/route.ts` — Zod + rate limit
- `src/app/api/ai/scenario/route.ts` — Zod + rate limit
- `src/app/api/ai/route.ts` — Rate limit
- `src/app/api/ai/briefing/route.ts` — Rate limit
- `src/app/api/ai/review/route.ts` — Rate limit
- `src/app/api/ai/insights/route.ts` — Rate limit
- `package.json` — Added zod dependency
