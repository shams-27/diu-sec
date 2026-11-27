# Layered Frontend/Backend Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the single Next.js app into `src/frontend/` and `src/backend/`, each grouped by feature, with no behavior change.

**Architecture:** Next routes stay in `src/app/` as thin files holding metadata plus a re-export of the page body from the owning frontend feature. Backend owns Prisma, auth, RBAC, audit, validation, all mutations and all read queries; frontend imports only backend's exported functions, schemas and types. Import aliases `@/frontend/*` and `@/backend/*` are added beside the existing `@/*`.

**Tech Stack:** Next.js 16.4.6, React 19.3.0, TypeScript strict, Prisma 6, Zod 3, Tailwind 4, Auth.js v5, Vitest, Playwright, pnpm — none change.

**Spec:** `docs/superpowers/specs/2026-11-27-layered-features-design.md`

## Global Constraints

- No new dependency, no Prisma schema/migration change, no auth/RBAC/audit logic change, no UI/markup/CSS change.
- Public URLs, metadata text, e2e selectors, seeded data and Auth.js cookie shape stay identical.
- Every mutation keeps the order: authenticate → `can()` via `src/backend/shared/admin-guard.ts` → Zod validate → transactional write → `writeAudit()`.
- Regexes stay only in `src/backend/shared/validators.ts`; no duplication.
- Keep existing action filenames verbatim when moving them; the feature folder is the module boundary. Do not merge or rename action files, because unit tests mock their exact module IDs.
- `src/app/` keeps `layout.tsx`, `globals.css`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `template.tsx`, `robots.ts`, `sitemap.ts`, `opengraph-image.tsx` and all API routes.
- A route `page.tsx` keeps its `metadata` export verbatim and gains `export { <FeaturePage> as default } from "@/frontend/features/<domain>/...";` — it contains no Prisma, no action and no markup.
- `tests/` and `e2e/` stay put; only their import specifiers change.
- E2E needs env: `set -a; . ./.env; set +a; pnpm e2e`. Playwright starts `next start --port 3003`, so run `pnpm build` before e2e and kill any stale listener on 3003.
- End every task with `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e && git diff --check`.

## Review Focus

- **Next 16 static analysis of thin route files:** a re-exported page must still prerender with its metadata and no layout shift — Task 1 moves the home page first, runs `pnpm build`, and the existing CLS/home e2e tests stay green.
- **Guard/logic loss during file moves:** a moved action that drops `requireActor`, `can()` or `writeAudit()` would silently open an admin route — Task 2 re-runs `tests/rbac.test.ts`, `tests/access-action.test.ts` and the RBAC-denial e2e, plus a new import-boundary test.
- **Shared validation divergence:** a copied regex would let bad IDs/emails through — Task 2 runs `tests/validators.test.ts` and the new boundary test asserts exactly one validators module exists.
- **Alias mismatch between TS, Vitest and Next:** a missing alias compiles in one tool and fails in another — Task 1 asserts all three configs and runs typecheck + full unit suite; Task 3 runs the full e2e suite.
- **Backend imported from a client bundle:** importing Prisma into a `"use client"` file would break the browser build — Task 3's boundary test asserts no frontend file imports `@/backend/shared/db` or `prisma`, and the build must pass.

---

### Task 1: Layer scaffold, shared modules, and pilot feature

**Files:**
- Modify: `tsconfig.json`, `vitest.config.mts`
- Create: `src/frontend/shared/{ui,shell,form}/`, `src/backend/shared/`
- Move: the shared files and pilot feature files listed in Step 3
- Test: `tests/layers.test.ts` (new)

**Interfaces:**
- Consumes: existing `@/* → ./src/*` alias and every current import path.
- Produces: aliases `@/frontend/* → ./src/frontend/*` and `@/backend/* → ./src/backend/*`; `tests/layers.test.ts` asserts `src/frontend/shared/ui/button.tsx`, `src/frontend/shared/shell/site-header.tsx`, `src/backend/shared/db.ts`, `src/backend/shared/validators.ts` exist and that both aliases resolve; `frontend/features/home/home-page.tsx` exports named `HomePage`.

- [ ] **Step 1: Write the failing structural test**

Create `tests/layers.test.ts` using `node:fs` with assertions that the four paths above exist and that `tsconfig.json` and `vitest.config.mts` each contain the strings `"@/frontend/*"` and `"@/backend/*"`.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test -- tests/layers.test.ts`
Expected: FAIL — paths do not exist.

- [ ] **Step 3: Add aliases and move shared + pilot files**

Add the two aliases in `tsconfig.json` (`compilerOptions.paths`) and `vitest.config.mts` (`resolve.alias`). Then `git mv`:

- `src/lib/{db,auth,admin-guard,audit,cache-tags,honeypot,rate-limit,rbac,session,storage,validators}.ts` → `src/backend/shared/`; also `src/auth.ts` → `src/backend/shared/auth.ts`.
- `src/lib/utils.ts` → `src/frontend/shared/utils.ts`.
- `src/components/ui/{button,card}.tsx` → `src/frontend/shared/ui/`.
- `src/components/public/{site-header,site-footer,site-nav-drawer}.tsx` and `src/components/admin/admin-sidebar.tsx` → `src/frontend/shared/shell/`.
- `src/components/public/{honeypot-field,page-hero}.tsx` → `src/frontend/shared/form/honeypot-field.tsx` and `src/frontend/shared/page-hero.tsx`.
- `src/components/public/stat-number.tsx` → `src/frontend/features/home/stat-number.tsx`.
- The body of `src/app/(public)/page.tsx` → `src/frontend/features/home/home-page.tsx`, exporting named `HomePage`; the route file keeps its metadata and gains `export { HomePage as default } from "@/frontend/features/home/home-page";`.

Rewrite all import specifiers across `src/`, `tests/` and `e2e/` with a mechanical pass: `@/lib/db` etc. → `@/backend/shared/...`, `@/auth` → `@/backend/shared/auth`, `@/components/ui/` → `@/frontend/shared/ui/`, `@/components/public/site-header` → `@/frontend/shared/shell/site-header`, and so on. Add `import "server-only";` as the first line of `src/backend/shared/db.ts` and `src/backend/shared/auth.ts`.

- [ ] **Step 4: Run the structural test, then the gate**

Run `pnpm test -- tests/layers.test.ts` → PASS. Then run the full gate.
Expected: all green; `pnpm build` confirms the thin re-export page prerenders; e2e home tests (CLS, drawer, impact) pass.

- [ ] **Step 5: Update docs and commit**

Update `docs/DECISIONS.md` with the layer split and the thin-route pattern. Commit: `feat(refactor): scaffold frontend/backend layers and shared modules`.

---

### Task 2: Backend feature modules and read queries

**Files:**
- Move: every file in `src/server/actions/` into its domain folder under `src/backend/features/<domain>/`, plus `src/lib/certs.ts`, `src/lib/idcard.ts`, `src/lib/dashboard.ts`
- Modify: page files that query Prisma directly (add exported query functions in `src/backend/features/<domain>/queries.ts` and call them)
- Test: extend `tests/layers.test.ts`

**Interfaces:**
- Consumes: `@/backend/shared/*` from Task 1.
- Produces: `src/backend/features/<domain>/<original-action-file>.ts` keeping every exported action name unchanged; `src/backend/features/<domain>/queries.ts` exporting one async read function per page query; no file under `src/backend/` imports `@/frontend`.

Domain mapping (move filenames verbatim):
`membership`: `members.ts`, `member-review.ts`, `idcard.ts` (from `src/lib/idcard.ts`) · `certificates`: `certificates.ts`, `certs.ts` (from `src/lib/certs.ts`) · `committee`: `committee.ts` · `wings`: `wings.ts` · `events`: `events.ts` · `magazine`: `magazine.ts` · `hall-of-fame`: `hall-of-fame.ts` · `projects`: `projects.ts` · `notices`: `notices.ts` · `resources`: `resources.ts` · `partners`: `sponsors.ts` · `gallery`: `gallery.ts` · `contact`: `contact.ts` · `access`: `access.ts` · `dashboard`: `dashboard.ts` (from `src/lib/dashboard.ts`, as `queries.ts`).

- [ ] **Step 1: Extend the failing structural test**

Add to `tests/layers.test.ts`: no file under `src/backend/` contains an import of `@/frontend`; `src/backend/features/` contains all 15 domain folders listed above; no file under `src/` imports `@/server/actions/` or `@/lib/`.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test -- tests/layers.test.ts`
Expected: FAIL — feature folders and new paths do not exist yet.

- [ ] **Step 3: Move actions and generators, rewrite imports**

`git mv` each file per the mapping. Rewrite all import specifiers in `src/`, `tests/` and `e2e/` from `@/server/actions/<file>` to `@/backend/features/<domain>/<file>` and `@/lib/certs` / `@/lib/idcard` / `@/lib/dashboard` to their new locations. Delete the now-empty `src/server/` and `src/lib/` directories.

- [ ] **Step 4: Extract page reads into `queries.ts`**

For each page with a direct `prisma.*` call, move that exact expression into `src/backend/features/<domain>/queries.ts` as a named exported async function (e.g. `getPublishedEvents`, `getMemberQueue`) with the same filters, ordering and selects; the page imports and awaits it. Preserve cached-home `use cache` / `updateTag` behavior and `connection()` calls in admin pages exactly as they are.

- [ ] **Step 5: Run gate and commit**

Run the structural test → PASS, then the full gate. Expected: 151 unit tests still pass, RBAC-denial and certificate e2e pass, lint/typecheck/build clean. Commit: `refactor(backend): group actions and queries by feature`.

---

### Task 3: Frontend feature modules and thin routes

**Files:**
- Move: every remaining file in `src/components/` and every page body under `src/app/(public)/` and `src/app/admin/`
- Modify: all `page.tsx` route files
- Test: extend `tests/layers.test.ts`

**Interfaces:**
- Consumes: `src/backend/features/<domain>/...` exports from Task 2 and `@/frontend/shared/...` from Task 1.
- Produces: `src/frontend/features/<domain>/<feature>-page.tsx` exporting named `<Feature>Page`; each route file keeps metadata and re-exports that name as default.

Feature mapping:
`membership`: `join/page.tsx`, `join/[memberId]/page.tsx`, `admin/members/page.tsx`, `membership-form.tsx`, `member-id-card.tsx` · `events`: `(public)/events/page.tsx`, `[slug]/page.tsx`, `admin/events/page.tsx`, `admin/events/[id]/page.tsx`, `admin/events/[id]/checkin/page.tsx`, `event-registration.tsx`, `syllabus-dialog.tsx`, `check-in-scanner.tsx` · `certificates`: `(public)/verify/page.tsx`, `[certId]/page.tsx`, `admin/certificates/page.tsx` · `committee`: `(public)/committee/page.tsx`, `admin/committee/page.tsx`, `committee-reorder.tsx` · `wings`: `(public)/wings/page.tsx`, `[slug]/page.tsx`, `admin/wings/page.tsx` · `dashboard`: `admin/page.tsx`, `wing-distribution-chart.tsx` · `magazine`: `(public)/magazine/page.tsx`, `[issueId]/page.tsx`, `admin/magazine/page.tsx` · `hall-of-fame`: public + admin pages · `projects`: public + admin pages · `notices`: public + admin pages · `resources`: `(public)/resources/page.tsx`, `admin/resources/page.tsx` · `partners`: `(public)/partners/page.tsx`, `admin/sponsors/page.tsx` · `gallery`: `(public)/gallery/page.tsx`, `admin/gallery/page.tsx`, `gallery-lightbox.tsx` · `faq`: `(public)/faq/page.tsx` · `contact`: `(public)/contact/page.tsx`, `contact-form.tsx` · `access`: `admin/access/page.tsx` · `audit`: `admin/audit/page.tsx`.

- [ ] **Step 1: Extend the failing structural test**

Add to `tests/layers.test.ts`: no `prisma` import and no `@/backend/shared/db` import under `src/frontend/`; no `.tsx` files remain under `src/components/`; every remaining `src/app/**/page.tsx` contains `as default } from "@/frontend/features/`; no `src/app/**/page.tsx` contains `prisma.`.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test -- tests/layers.test.ts`
Expected: FAIL — components still in `src/components/`, page bodies still inline.

- [ ] **Step 3: Move components and page bodies**

`git mv` each component into the feature folder listed above. For each page, move the whole component body into `src/frontend/features/<domain>/<feature>-page.tsx` as a named export, keeping its imports; the route file keeps its `metadata` export verbatim and becomes `export { <Feature>Page as default } from "@/frontend/features/<domain>/<feature>-page";`. Rewrite all import specifiers, including `@/components/public/...` → the new feature/shared paths.

- [ ] **Step 4: Run gate and commit**

Run the structural test → PASS, then the full gate. Expected: 151 unit tests and 17 e2e tests pass; build and CLS/Lighthouse behavior unchanged. Commit: `refactor(frontend): group UI by feature with thin routes`.

---

### Task 4: Docs, cleanup, and final verification

**Files:**
- Modify: `README.md`, `AGENTS.md`, `docs/design-system.md`, `docs/DECISIONS.md`
- Delete: empty legacy directories (`src/components/`, `src/lib/`, `src/server/` if not already gone)

**Interfaces:**
- Consumes: the final tree from Tasks 1–3.

- [ ] **Step 1: Update docs**

Update the repository structure and rule references in `README.md` and `AGENTS.md` to the new paths; update `docs/design-system.md` path examples; append decisions for keeping action filenames, keeping tests/e2e in place, and the thin-route convention.

- [ ] **Step 2: Remove empty directories and verify**

Delete any empty legacy directories. Run the full gate plus Lighthouse (perf/a11y/best-practices/SEO and CLS/LCP). Expected: no regressions versus the prior 100/100/96/100, CLS 0, LCP under 1s.

- [ ] **Step 3: Commit**

```bash
git add -A README.md AGENTS.md docs/design-system.md docs/DECISIONS.md
git commit -m "docs: describe layered feature structure"
```
