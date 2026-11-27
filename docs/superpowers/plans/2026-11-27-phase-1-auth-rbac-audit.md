# Phase 1 — Auth, RBAC & Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add @diu.edu.bd-only Google SSO with role-bearing JWT sessions, server-enforced `/admin` access, and the A-12 role-management and immutable audit-viewer pages.

**Architecture:** Auth.js v5 handles Google OAuth and JWT callbacks; Next 16 `proxy.ts` gives an optimistic redirect while `can()` in layouts/pages/actions is the real gate. A-12 writes go through a server action that audits every role change; the audit page is read-only and the Phase 0 DB trigger blocks edits to the log.

**Tech Stack:** Next 16.4.6 App Router, Auth.js v5 (`next-auth@beta` 5.0.0-beta.32), Prisma 6, Zod 3, Vitest, Tailwind 4 / shadcn.

**Spec:** `docs/superpowers/specs/2026-11-27-phase-1-auth-rbac-audit-design.md`, `README.md` Sections 8/10, `docs/requirements/admin-panel.md` A-12.

## Global Constraints

- Only `@diu.edu.bd` accounts; unverified Google emails rejected.
- JWT sessions, no adapter/session tables (DECISIONS #2). Role read from `User` by email at sign-in only.
- A user with no assigned role gets no admin access. Wing Leads are limited to their own wing.
- All regexes and Zod schemas live in `src/lib/validators.ts`; never duplicate them.
- Every mutation is a server action: authenticate → authorize (`can()`) → Zod-validate → write → `writeAudit()`.
- `AuditLog` is append-only; no update/delete endpoints.
- Loading, empty, error, not-found states; mobile-first ≥360px; keyboard accessible; use `docs/design-system.md` tokens.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` must pass before the phase commit.

## Review Focus

- Session token without a role must be denied by both proxy and server code — test `sessionToActor(null)` and `can()` with a null role in Task 2.
- A non-@diu.edu.bd or unverified Google profile must be rejected — test `isDiuEmail` in Task 1 and pin `email_verified` in the `signIn` callback code.
- Role assignment must not accept arbitrary strings — test `roleAssignmentSchema` in Task 3.
- Audit filter input (action, dates) must not produce invalid queries — test `auditFilterSchema` in Task 4.
- Role changes must be audited with the actor from the session, not from form data — Task 3 step calls `writeAudit` with `session.user.id`; reviewer checks the action body.

---

### Task 1: Auth.js Google SSO and JWT session

**Files:**
- Modify: `package.json`, `src/lib/validators.ts`
- Create: `src/auth.ts`, `src/types/next-auth.d.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/proxy.ts`
- Test: `tests/auth-domain.test.ts`

**Interfaces:**
- Consumes: `db` from `@/lib/db`, `DIU_EMAIL_DOMAIN` from `@/lib/validators`.
- Produces: `auth`, `handlers`, `signIn`, `signOut` from `@/auth`; `isDiuEmail(email: unknown): boolean` from `@/lib/validators`; session fields `user.id`, `user.role`, `user.wingId`.

- [x] **Step 1: Write the failing test**

`tests/auth-domain.test.ts`: `isDiuEmail("Student@DIU.edu.bd")` is `true`; `isDiuEmail("student@gmail.com")`, `isDiuEmail("student@diu.edu.bd.evil.com")`, `isDiuEmail(null)` are `false`.

- [x] **Step 2: Run it to verify it fails**

Run `pnpm test`; expect a missing-export failure for `isDiuEmail`.

- [x] **Step 3: Install Auth.js**

Run `pnpm add next-auth@beta`. Expect `next-auth@5.0.0-beta.32` or later v5 in `package.json`; log the dependency in `docs/DECISIONS.md` with the reason (only v5 supports Next 16 + `proxy.ts`).

- [x] **Step 4: Implement `isDiuEmail` in `src/lib/validators.ts`**

One function using `DIU_EMAIL_DOMAIN` and `diuEmailSchema.safeParse` — no new regex.

- [x] **Step 5: Configure Auth.js**

`src/auth.ts`: `NextAuth({ providers: [Google], session: { strategy: "jwt" }, callbacks: { signIn, jwt, session, authorized } })`.
- `signIn`: return `profile.email_verified === true && isDiuEmail(profile.email)`.
- `jwt`: only when `user` is present, query `db.user.findUnique({ where: { email: user.email } })` and set `token.id/role/wingId` (null when no row). No DB access on later calls.
- `session`: copy token fields to `session.user`.
- `authorized`: `return !!auth?.user?.role` (proxy matcher limits this to `/admin/:path*`).
Export `handlers`, `auth`, `signIn`, `signOut`. Add module augmentation in `src/types/next-auth.d.ts` for the three fields. Route handler exports `GET`/`POST` from `handlers`; `src/proxy.ts` exports `auth as proxy` with `matcher: ["/admin/:path*"]`.

- [x] **Step 6: Verify**

Run `pnpm test && pnpm typecheck`; expect all tests green and no type errors.

---

### Task 2: Server-side admin guard

**Files:**
- Create: `src/lib/session.ts`
- Modify: `src/app/admin/layout.tsx`
- Test: `tests/session.test.ts`

**Interfaces:**
- Consumes: `auth` from `@/auth`, `can`/`Actor`/`assertCan` from `@/lib/rbac`.
- Produces: `sessionToActor(session): Actor` (pure) and `requireActor(module: AdminModule, action: Action, wingId?: string | null): Promise<Actor>` that throws `ForbiddenError` when denied.

- [x] **Step 1: Write the failing test**

`tests/session.test.ts`: `sessionToActor(null)` returns `{ role: null }`; a session with `role: "WING_LEAD"` and `wingId: "w1"` maps to the same role/wing; `can(sessionToActor(session), "members", "write")` is `false`.

- [x] **Step 2: Run it to verify it fails**

Run `pnpm test`; expect missing `sessionToActor`.

- [x] **Step 3: Implement the guard**

`sessionToActor` maps `session?.user?.role/wingId` to `Actor`. `requireActor` calls `auth()`, maps via `sessionToActor`, calls `assertCan`; a missing session maps to a null role and is therefore denied.

- [x] **Step 4: Wire the admin layout**

Make `src/app/admin/layout.tsx` async; call `await requireActor("dashboard", "read")` so a signed-out or roleless user cannot see the shell. Keep the Phase 0 markup unchanged.

- [x] **Step 5: Verify**

Run `pnpm test && pnpm typecheck`; expect green.

---

### Task 3: A-12 role management

**Files:**
- Modify: `src/lib/validators.ts`
- Create: `src/server/actions/access.ts`, `src/app/admin/access/page.tsx`, `src/app/admin/access/loading.tsx`, `src/app/admin/access/error.tsx`
- Test: `tests/validators.test.ts` (append cases)

**Interfaces:**
- Consumes: `requireActor`, `writeAudit`, `db`, `Role`/`Wing` data.
- Produces: `roleAssignmentSchema` (Zod) and `setUserRoleAction(formData: FormData): Promise<void>`.

- [x] **Step 1: Write the failing test**

Append to `tests/validators.test.ts`: `roleAssignmentSchema.safeParse({ userId: "u1", role: "WING_LEAD", wingId: "w1" })` succeeds; `role: "ADMIN"` and `userId: ""` fail; `wingId: undefined` succeeds.

- [x] **Step 2: Run it to verify it fails**

Run `pnpm test`; expect missing export.

- [x] **Step 3: Add `roleAssignmentSchema` to `src/lib/validators.ts`**

`z.object({ userId: z.string().min(1), role: z.enum(["SUPER_ADMIN","GENERAL_SECRETARY","WING_LEAD","PUBLICATION_EDITOR"]), wingId: z.string().min(1).optional() })`.

- [x] **Step 4: Write the server action**

`src/server/actions/access.ts`: `"use server"`; `setUserRoleAction(formData)` → `const actor = await requireActor("access", "write")` → `roleAssignmentSchema.parse(Object.fromEntries(formData))` → `db.user.update` (set `wingId: null` when omitted) → `writeAudit({ actorId: actor.id, action: "UPDATE", entity: "User", entityId: userId, before, after })` → `revalidatePath("/admin/access")`. Never read actor identity from form data.

- [x] **Step 5: Build the access page**

Server component: `await requireActor("access", "read")`; list `db.user.findMany({ include: { wing: true }, orderBy: { email: "asc" } })` and wings. Render a responsive table with a role `<select>` + wing `<select>` per user and a submit button bound to the action. Show an empty state when there are no users. Add `loading.tsx` (skeleton) and `error.tsx` (retry link) using design-system tokens.

- [x] **Step 6: Verify**

Run `pnpm test && pnpm typecheck && pnpm lint`; expect green.

---

### Task 4: A-12 immutable audit viewer

**Files:**
- Modify: `src/lib/validators.ts`
- Create: `src/app/admin/audit/page.tsx`, `src/app/admin/audit/loading.tsx`, `src/app/admin/audit/error.tsx`
- Test: `tests/validators.test.ts` (append cases)

**Interfaces:**
- Consumes: `requireActor`, `db`, `auditFilterSchema`.
- Produces: `auditFilterSchema` (Zod) parsing `URLSearchParams`-shaped input into `{ action?, entity?, email?, from?, to? }`.

- [x] **Step 1: Write the failing test**

Append to `tests/validators.test.ts`: valid `AuditAction` accepted; `action: "DROP_TABLE"` rejected; `from: "2026-11-27"` coerced to a `Date`; `from: "not-a-date"` rejected; empty strings treated as absent.

- [x] **Step 2: Run it to verify it fails**

Run `pnpm test`; expect missing export.

- [x] **Step 3: Add `auditFilterSchema` to `src/lib/validators.ts`**

Use `z.enum` over the Prisma `AuditAction` values and `z.coerce.date()` for `from`/`to`; `transform` empty strings to `undefined`.

- [x] **Step 4: Build the audit page**

Server component: `await requireActor("audit", "read")`; parse `searchParams` with `auditFilterSchema`; query `db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 100, include: { actor: true } })`. Render a filter form (action, entity, email, from, to) and a read-only table with timestamp, actor, action, entity, entityId. Empty state when no rows. No edit/delete controls anywhere. Add `loading.tsx`/`error.tsx`.

- [x] **Step 5: Verify**

Run `pnpm test && pnpm typecheck && pnpm lint`; expect green.

---

### Task 5: Phase verification and commit

- [x] **Step 1: Run all gates** — `pnpm lint && pnpm typecheck && pnpm test && pnpm build`; fix every failure.
- [x] **Step 2: Browser/DB check** — signed-out `/admin` redirects; seeded super-admin can view `/admin/access` and `/admin/audit`; an `UPDATE`/`DELETE` on `AuditLog` still fails with `AuditLog is append-only`.
- [x] **Step 3: Tick README Phase 1 checkboxes**, append decisions (Auth.js v5 beta, `proxy.ts`, default sign-in page, 100-row cap), run `/ponytail-review`, then commit with `feat(phase-1): auth, rbac and audit`.

## Self-Review

- Spec coverage: SSO/domain restriction → Task 1; JWT role/wing → Task 1; `proxy.ts` + server enforcement → Tasks 1–2; A-12 roles → Task 3; A-12 audit viewer → Task 4; append-only → existing trigger re-verified in Task 5; states/accessibility → Tasks 3–4.
- Types: `Actor`, `AdminModule`, `Action`, `ForbiddenError` come from `rbac.ts`; `requireActor` returns `Actor` and is used by Tasks 3–4; session fields are augmented in Task 1 and consumed in Task 2.
- Review Focus items each have a named test or an exact code step.
