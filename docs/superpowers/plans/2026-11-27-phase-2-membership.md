# Membership (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the public `/join` application with an instant Digital Member ID Card and the A-02 admin review queue with CSV export.

**Architecture:** A public server action validates and stores `PENDING` members using the shared Zod schema; the applicant is redirected to a card page rendered from the saved row. Admin mutations go through audited server actions using the existing RBAC matrix; CSV export is a read-only route handler with the same wing scoping. Card PNG/PDF download is drawn on a client canvas, with `pdf-lib` embedding the PNG.

**Tech Stack:** Next 16 App Router, TypeScript strict, Prisma 6, Zod 3, React `useActionState`, Tailwind 4 semantic tokens, Vitest, `pdf-lib`.

**Spec:** `docs/superpowers/specs/2026-11-27-phase-2-membership-design.md`

## Global Constraints

- All regexes and Zod schemas live in `src/lib/validators.ts`; never duplicate the student-ID, DIU-email, cert-ID or GitHub URL rules.
- Every mutation: authenticate → authorize (`can()`/`assertCan()`) → Zod-validate → write → `writeAudit()`. AuditLog stays append-only.
- Wing Leads read only their own wing; hide-nothing is not authorization.
- Follow `docs/design-system.md`: semantic tokens only, mobile-first ≥360px, visible focus rings, loading/empty/error states.
- No secrets in git; new env vars go in `.env.example`.
- One commit at the end: `feat(phase-2): membership applications and review`.

## Review Focus

- Duplicate student ID or email submitted twice → friendly error, no second row, no audit row for the rejected attempt. Test in Task 2.
- A stale `PENDING` card opened later must not become valid by guessing the URL → card status always read from DB. Test in Task 2.
- Wing Lead calling a review action on another wing's member → `ForbiddenError`, no write, no audit. Test in Task 3.
- Approving the same member twice must not allocate two card numbers or duplicate audit rows. Test in Task 3.
- CSV export bypass via a role-less session or a Wing Lead asking for all wings → denied/ scoped. Test in Task 3.

---

### Task 1: Shared primitives

**Files:**
- Modify: `src/lib/validators.ts`, `src/lib/admin-guard.ts`, `src/lib/idcard.ts` (create)
- Test: `tests/idcard.test.ts`, `tests/session.test.ts`

**Interfaces:**
- Consumes: `db`, `assertCan`, `auth`, `sessionToActor`.
- Produces: `memberReviewSchema` (Zod), `nextMemberCardNo(tx, date) -> string`, `requireActor(module, action, resourceWingId?: string | null | "own") -> AdminActor`.

- [x] **Step 1: Write failing tests** — `tests/idcard.test.ts` asserts `nextMemberCardNo` returns `SEC-2026-0002` when one card with prefix `SEC-2026-` exists and `SEC-2027-0001` for an empty 2027; `tests/session.test.ts` adds a case that `"own"` with a wingless WING_LEAD denies and with `wingId: "w1"` passes `can()`.
- [x] **Step 2: Run `pnpm test`** — expected FAIL for missing export and missing behavior.
- [x] **Step 3: Implement** — add `memberReviewSchema` to `validators.ts`; add `nextMemberCardNo` counting rows by prefix inside the passed transaction client; extend `requireActor` to resolve `"own"` to `actor.wingId` before `assertCan`.
- [x] **Step 4: Run `pnpm test && pnpm typecheck`** — expected PASS.

### Task 2: Public join flow and card

**Files:**
- Create: `src/server/actions/members.ts`, `src/components/public/membership-form.tsx`, `src/components/public/member-id-card.tsx`, `src/app/(public)/join/page.tsx`, `src/app/(public)/join/[memberId]/page.tsx`
- Modify: `package.json` (add `pdf-lib`), `docs/DECISIONS.md`
- Test: `tests/member-submit.test.ts`

**Interfaces:**
- Consumes: `memberApplicationSchema`, `db`, `writeAudit`.
- Produces: `submitMembershipAction(prev: SubmitState, formData: FormData) -> Promise<SubmitState>` where `SubmitState = { error?: string; memberId?: string }`; `MemberIdCard({ member }: { member: CardMember })` with `CardMember = { name, studentId, email, batch?, memberCardNo?, status, wingName? }`.

- [x] **Step 1: Write the failing test** — mock `db` and `writeAudit`; assert invalid ID/email returns an error without writing; assert a duplicate returns the duplicate error without writing or auditing; assert a valid application creates one `PENDING` row and audits with `actorEmail` and `actorId: null`.
- [x] **Step 2: Run `pnpm test`** — expected FAIL (module missing).
- [x] **Step 3: Install `pdf-lib`** with `pnpm add pdf-lib` and log why in `docs/DECISIONS.md`.
- [x] **Step 4: Implement the action** — public submit: parse with `memberApplicationSchema`, look up duplicate by studentId or email, create `PENDING`, `writeAudit({ actorEmail, action: "CREATE", entity: "Member", entityId })`, return `{ memberId }`. Catch Prisma P2002 as the duplicate error.
- [x] **Step 5: Build the join page and form** — server page loads wings; client form uses `useActionState` with labeled inputs, inline `role="alert"` error, and `aria-live` success redirect. Empty state when no wings exist.
- [x] **Step 6: Build the card page and canvas card** — `/join/[memberId]` reads the member by id with `notFound()`; card draws name, ID, batch, wing, card number or "PENDING", and a `PENDING APPROVAL`/`INVALID` watermark from the DB status; buttons download PNG via `toBlob` and PDF via `pdf-lib` `embedPng`.
- [x] **Step 7: Run `pnpm lint && pnpm typecheck && pnpm test`** — expected PASS.

### Task 3: Admin review queue and CSV

**Files:**
- Create: `src/server/actions/member-review.ts`, `src/app/admin/members/page.tsx`, `src/app/api/admin/members/export/route.ts`
- Modify: `tests/` (new `tests/member-review.test.ts`)
- Test: `tests/member-review.test.ts`

**Interfaces:**
- Consumes: `requireActor("members", ...)`, `memberReviewSchema`, `nextMemberCardNo`, `writeAudit`.
- Produces: `reviewMemberAction(formData: FormData) -> Promise<void>`; CSV route `GET /api/admin/members/export`.

- [x] **Step 1: Write failing tests** — mock guard/db/audit; assert WING_LEAD write is denied before any write/audit, assert APPROVE allocates one card number and audits before/after, assert second APPROVE on an already-approved member makes no write.
- [x] **Step 2: Run `pnpm test`** — expected FAIL.
- [x] **Step 3: Implement the action** — `requireActor("members","write")`, Zod-parse decision, load target inside a serializable transaction, re-check wing ownership with `can(actor,"members","write",member.wingPrefId)`, apply transition (`APPROVE`/`REISSUE` assign card number when missing or reissue; `REJECT`/`REVOKE` keep the card number and let status invalidate it (DECISIONS #22)), `writeAudit`, `revalidatePath("/admin/members")`.
- [x] **Step 4: Build the queue page** — `requireActor("members","read","own")`, filter by status and (for leads) own wing, table with review forms, empty state, link to CSV; use `connection()` before `requireActor` per Phase 1 fix.
- [x] **Step 5: Build the CSV route** — same guard/scoping, RFC-4180 escaping, `Content-Disposition: attachment`, no pagination cap for export.
- [x] **Step 6: Run `pnpm lint && pnpm typecheck && pnpm test`** — expected PASS.

### Task 4: Verify, document, commit

- [x] **Step 1: Tick README Phase 2 checkboxes** and append decisions for public-audit actor, `"own"` sentinel, native forms, `pdf-lib`.
- [x] **Step 2: Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`** — all green.
- [x] **Step 3: Production smoke** — start `next start`, verify at 360px and desktop: apply with valid/invalid/duplicate data, card preview and both downloads, admin approve/reject/revoke/reissue, CSV download, WING_LEAD denial, and no prerender errors in the server log.
- [x] **Step 4: Commit** — `git add -A && git commit -m "feat(phase-2): membership applications and review"`.

## Self-review

Spec coverage: module 04 validation + instant card (Task 2), A-02 review/revoke/reissue/CSV (Task 3), RBAC + audit (Tasks 1–3), states/responsive (Tasks 2–3). Review Focus items each have a named test. Types are consistent across task interfaces. Plan is shorter than the implementation it describes.
