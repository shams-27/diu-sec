# Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Fix all 20 findings from the 2026-11-27 repository audit without changing the product's features.

**Architecture:** Keep the existing feature-first frontend/backend layout. Fix root causes in shared code where several actions share the bug (rate limit, retry conflicts, audit export). Where a fix needs outside infrastructure that the stack does not provide (shared S3 storage, shared cache store), narrow the documented deployment to the supported single-instance self-hosted setup instead of adding a dependency.

**Tech Stack:** Next.js 16, React 19, Prisma 6/Postgres, Auth.js v5, Zod 3, Vitest, Playwright, pnpm.

**Spec:** The audit report delivered in this conversation (20 numbered findings).

## Global Constraints

- Validators stay only in `src/backend/shared/validators.ts`.
- Every mutation: authenticate → authorize → Zod validate → write → `writeAudit()`.
- AuditLog append-only. Seats change only in a transaction. Wing leads stay in their own wing.
- No new dependencies without a `docs/DECISIONS.md` entry.
- Full gate per batch: `pnpm lint && pnpm typecheck && pnpm test`, then `pnpm build` before e2e.

## Batches

1. **Public input safety:** past-event registration, client `memberId`, event-less duplicate certificates, revoked PDF link, ID-card clipping, event slug on edit, `/events` query filter. Tests in `tests/events.test.ts`, `tests/certificates.test.ts`, `tests/idcard.test.ts`, e2e certificate spec.
2. **Admin write safety:** magazine upload cleanup, committee IDs, P2034 handling, audit email search, CSV export audit. Tests in existing action test files.
3. **Shared state and deployment:** shared rate limiting, TRUNCATE guard, demo seed opt-in, single-instance deployment docs, e2e seat cleanup. Tests in `tests/rate-limit.test.ts`, migration structural test, e2e helpers/spec.
4. **Lean cleanup:** remove dead config, unused env vars and `ip` audit option; fix shadcn aliases; update `docs/DECISIONS.md`.

Each batch: write failing test → verify RED → minimal fix → verify GREEN → full gate → commit.
