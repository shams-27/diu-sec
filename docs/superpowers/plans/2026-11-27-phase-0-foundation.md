# Phase 0 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the repo buildable and testable: Next.js app scaffold, design-system tokens, Prisma schema/migration/seed, shared validators with tests, and public/admin shells.

**Architecture:** Keep the hand-written domain files already in the repo (`prisma/schema.prisma`, `src/lib/{db,validators,rbac,audit}.ts`, `prisma/sql/audit_append_only.sql`) as the source of truth; scaffold the app around them rather than replacing them. Tailwind tokens come from the UI/UX Pro Max design-system output and are consumed by both shells.

**Tech Stack:** Next.js App Router + TypeScript strict, Tailwind + shadcn/ui, PostgreSQL + Prisma, Zod, Vitest, pnpm. Exact versions are whatever `pnpm create next-app@latest` resolves, except Zod is pinned to `^3` because `src/lib/validators.ts` uses `z.string().cuid()`.

**Spec:** `README.md` Sections 1, 4–6, 10 (Phase 0), 11; `docs/requirements/{website,admin-panel}.md`; `AGENTS.md`.

## Global Constraints

- Validators and ID/email/cert/GitHub regexes live **only** in `src/lib/validators.ts`.
- Auth is Google SSO `@diu.edu.bd`, JWT sessions; no auth DB tables (decision #2).
- `AuditLog` is append-only; the trigger in `prisma/sql/audit_append_only.sql` is part of the first migration.
- Every mutation later goes through a server action: authenticate → `can()` → Zod → write → `writeAudit()`.
- New env vars go in `.env.example`; `.env` is never committed.
- Commit after the phase finishes: `feat(phase-0): foundation` (AGENTS.md overrides per-task commits).
- After the phase: `pnpm lint && pnpm typecheck && pnpm test` must pass; check pages at 360px and desktop with Playwright.

## Review Focus

- A student ID with the wrong department code or a 2-digit suffix must be rejected — pinned in `tests/validators.test.ts` (Task 3).
- A non-`@diu.edu.bd` email (including a lookalike like `x@diu.edu.bd.evil.com`) must be rejected — pinned in `tests/validators.test.ts` (Task 3).
- Generated cert IDs must be unique, match `certIdSchema`, and contain no ambiguous characters — pinned in `tests/validators.test.ts` (Task 3).
- Cross-wing RBAC writes must be denied; same-wing reads allowed — pinned in `tests/rbac.test.ts` (Task 3).
- The DB must reject `UPDATE`/`DELETE` on `AuditLog` regardless of application code — checked against the applied migration in Task 4.

---

### Task 1: Toolchain and Next.js scaffold

**Files:** Create `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.prettierrc`, `vitest.config.ts`, `.gitignore`, `.env.example`, `src/app/globals.css`, `src/app/layout.tsx`.

**Interfaces:**
- Consumes: existing `src/lib/*` and `prisma/schema.prisma`.
- Produces: `@/*` path alias → `src/*`; scripts `dev`, `build`, `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `e2e`, `prisma migrate dev`, `prisma db seed`.

- [ ] **Step 1: Scaffold** — run `pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --no-turbopack`. Keep existing `src/lib` files. Do not commit `.env`.
- [ ] **Step 2: Add shadcn/ui** — run `pnpm dlx shadcn@latest init` with defaults, then `pnpm dlx shadcn@latest add button card` for the shell primitives.
- [ ] **Step 3: Install remaining deps** — `pnpm add @prisma/client zod@^3 && pnpm add -D prisma vitest @vitejs/plugin-react tsx prettier eslint-config-prettier`. Add `prisma.seed = "tsx prisma/seed.ts"` to `package.json`.
- [ ] **Step 4: Configure** — add the scripts above, `vitest.config.ts` with the `@` alias, `.prettierrc`, and `.env.example` with exactly the README Section 4 variables (no secrets). Create a local `.env` using `postgresql://postgres@127.0.0.1:5432/diusec?schema=public` (local Postgres trusts TCP) and placeholder auth values.
- [ ] **Step 5: Verify** — `pnpm lint && pnpm typecheck && pnpm test` (no tests yet: Vitest exits 0 if configured with `passWithNoTests` or a smoke test is added in Task 3).

### Task 2: Design system and Tailwind tokens

**Files:** Create `docs/design-system.md`; modify `src/app/globals.css`.

**Interfaces:**
- Consumes: UI/UX Pro Max design-system output.
- Produces: CSS custom properties (`--background`, `--foreground`, `--primary`, `--brand-*`, spacing scale) used by both shells.

- [ ] **Step 1: Generate** — invoke the `ui-ux-pro-max`, `design-system` and `ui-styling` skills, then run `python3 /home/shams/.opencode/skills/ui-ux-pro-max/scripts/search.py "university student engineering club community website and admin dashboard" --design-system -p "DIU SEC" --format markdown --output-dir . --force` (the repo-local `.opencode/skills` copy named in AGENTS.md does not exist; use the installed global copy and log this in `DECISIONS.md`).
- [ ] **Step 2: Write the doc** — save the recommendation plus the chosen palette, type scale, spacing and component rules to `docs/design-system.md`.
- [ ] **Step 3: Apply tokens** — translate the chosen palette/type/space into Tailwind CSS variables in `src/app/globals.css`; keep shadcn's `--background`/`--foreground`/`--primary` names compatible.
- [ ] **Step 4: Verify** — `pnpm typecheck` and confirm `docs/design-system.md` exists and `globals.css` contains the tokens.

### Task 3: Validators and RBAC unit tests

**Files:** Create `tests/validators.test.ts`, `tests/rbac.test.ts`; modify `src/lib/validators.ts` only if a test exposes a bug.

**Interfaces:**
- Consumes: `studentIdSchema`, `diuEmailSchema`, `certIdSchema`, `githubRepoSchema`, `generateCertId`, `can()` from `src/lib/rbac.ts`.
- Produces: passing test suite that pins the spec's validation and wing-scoping rules.

- [ ] **Step 1: Write failing tests** — cases: `221-35-123` accepted; `221-36-123` and `221-35-12` rejected; `student@diu.edu.bd` accepted; `student@gmail.com` and `student@diu.edu.bd.evil.com` rejected; `DIU-SEC-CERT-A2B3C4` accepted; `generateCertId()` matches `certIdSchema` and 100 generated IDs are unique; `https://github.com/diu-sec/site` accepted and `https://gitlab.com/x/y` rejected; `can({role:"WING_LEAD",wingId:"w1"},"members","write","w2") === false` and `can(...,"w1") === true`.
- [ ] **Step 2: Run them** — `pnpm test`; fix any failure in `src/lib/validators.ts` at the single source of truth, not in the tests.
- [ ] **Step 3: Verify** — `pnpm test` passes all cases.

### Task 4: Prisma migration, audit trigger and seed

**Files:** Create `prisma/migrations/<ts>_init/migration.sql`, `prisma/seed.ts`; modify `prisma/schema.prisma` only if migration fails.

**Interfaces:**
- Consumes: `prisma/schema.prisma`, `prisma/sql/audit_append_only.sql`, `.env`.
- Produces: applied migration + generated Prisma client + idempotent seed (super admin, 5 wings, 2026 ExecSession, sample committee/event/member data).

- [ ] **Step 1: Create the DB and migration** — `psql -h 127.0.0.1 -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='diusec'"` then `createdb -h 127.0.0.1 -U postgres diusec` if absent; `pnpm prisma migrate dev --create-only --name init`; append the contents of `prisma/sql/audit_append_only.sql` to the generated `migration.sql`; `pnpm prisma migrate dev` to apply and generate the client.
- [ ] **Step 2: Write the seed** — `prisma/seed.ts` uses upserts keyed by the unique fields (`email`, `slug`, `year`, `number`), reads `SUPER_ADMIN_EMAIL` from env with a documented fallback, and inserts: 1 super admin, the 5 wings from the spec, 2026 + 2025 sessions, 2 committee members, 1 published event, 1 approved member, 1 notice.
- [ ] **Step 3: Verify seed and immutability** — `pnpm prisma db seed` twice, then check counts with `psql`; attempt `UPDATE "AuditLog" SET entity='x'` and confirm it fails with `AuditLog is append-only`.

### Task 5: Public and admin shells

**Files:** Create `src/app/(public)/{layout,page,loading,error,not-found}.tsx`, `src/app/admin/{layout,page,loading,error,not-found}.tsx`, `src/components/public/site-header.tsx`, `src/components/public/site-footer.tsx`, `src/components/admin/admin-sidebar.tsx`.

**Interfaces:**
- Consumes: Tailwind tokens (Task 2), shadcn `button`/`card`, design-system component rules.
- Produces: responsive shells with skip link, semantic nav/main/footer, keyboard-visible focus, and placeholder pages linking to the modules that later phases implement.

- [ ] **Step 1: Public shell** — header with club wordmark, nav links to `/committee`, `/wings`, `/join`, `/events`, `/verify`, and a skip-to-content link; footer with contact/FAQ links; mobile menu that works without JS-heavy state.
- [ ] **Step 2: Admin shell** — sidebar listing A-01…A-12 routes under `/admin`, active-link styling, mobile-collapsible navigation, and `main` landmark. Placeholder `/admin` page shows zeroed dashboard cards.
- [ ] **Step 3: States** — add `loading.tsx`, `error.tsx`, `not-found.tsx` to both route groups with a retry/link back; empty states on placeholder pages.
- [ ] **Step 4: Verify in browser** — run `pnpm dev`, open `/` and `/admin` at 360px and desktop with Playwright; confirm no horizontal scroll, focus rings visible, nav reachable by keyboard.

### Task 6: Phase verification and commit

- [ ] **Step 1: Run gates** — `pnpm lint && pnpm typecheck && pnpm test && pnpm build`; fix every failure.
- [ ] **Step 2: Tick README Phase 0 checkboxes** and append decisions (pnpm installed globally, global UI/UX Pro Max path, local Postgres URL) to `docs/DECISIONS.md`.
- [ ] **Step 3: Run `/ponytail-review`**, then commit all Phase 0 files with `feat(phase-0): foundation`.
