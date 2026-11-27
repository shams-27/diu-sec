# Phase 2 Design — Membership (04 + A-02)

## Intent

Let a DIU SWE student apply at `/join`, instantly see/download a Digital Member ID Card, and let authorized admins review, approve, reject, revoke or reissue that card and export members to CSV.

## Goals

- `/join` validates student ID `XXX-35-XXX` and `@diu.edu.bd` email with the shared Zod schema, blocks duplicates, and saves `PENDING`.
- On submission the applicant lands on a shareable card page marked "Pending approval"; once approved the card shows `SEC-<year>-<seq>` and is active. Revoked/rejected cards render invalid.
- `/admin/members` lists applications with status/wing filters; SUPER_ADMIN and GENERAL_SECRETARY can review, WING_LEAD can read only their own wing's applicants; CSV export follows the same scoping.
- Every mutation is an audited server action; no update/delete path touches AuditLog.

## Non-goals

- Anti-bot/rate limiting (Phase 9), committee/wing CRUD (Phase 3), certificate PDFs (Phase 5), email delivery.

## Constraints

- Prisma `Member` already has all needed fields; no schema migration required.
- `memberApplicationSchema` already exists in `src/lib/validators.ts` — do not duplicate ID/email rules.
- All regexes and new Zod schemas live in `src/lib/validators.ts`.
- Mutations: authenticate → authorize → Zod-validate → write → `writeAudit()`.
- Follow `docs/design-system.md` tokens; mobile-first ≥360px, keyboard accessible, loading/empty/error states from the route group shells.
- `pdf-lib` is in the README stack and is needed only to embed the card PNG in a downloadable PDF.

## Approaches

1. **Native form + server action + `useActionState` (chosen).** Server-side Zod is the single source of truth; no extra form dependency. React Hook Form can be added later if multi-step validation is needed.
2. React Hook Form + `@hookform/resolvers/zod`. Rejected for now: duplicates validation on both sides for one short form and adds two dependencies.
3. Client-only localStorage "membership". Rejected: no persistence, no review queue, no audit.

## Design

### Files

- `src/lib/idcard.ts` — `nextMemberCardNo(tx)` allocates `SEC-<year>-<seq>` inside a serializable transaction (unique constraint is the backstop).
- `src/lib/admin-guard.ts` — accept `"own"` as `resourceWingId` so list pages can ask for wing-scoped read without a second `auth()` call.
- `src/lib/validators.ts` — `memberReviewSchema` (`APPROVE | REJECT | REVOKE | REISSUE`).
- `src/server/actions/members.ts`
  - `submitMembershipAction(prevState, formData)` — public; Zod-validate, duplicate-check, create `PENDING`, write audit with applicant email as actor, return `{ memberId }` or `{ error }`.
  - `reviewMemberAction(formData)` — `requireActor("members","write")`, validate, check target wing for wing leads, transition status, assign/reissue card number, audit in the same transaction.
- `src/app/(public)/join/page.tsx` — form + wing choices; empty state when no wings are seeded.
- `src/components/public/membership-form.tsx` — client form with `useActionState`, inline error live region.
- `src/app/(public)/join/[memberId]/page.tsx` — card preview from DB with status watermark.
- `src/components/public/member-id-card.tsx` — canvas-rendered card; "Download PNG" and "Download PDF" (pdf-lib embeds the PNG).
- `src/app/admin/members/page.tsx` — review queue with status/wing filters, per-row review controls, CSV link; empty/loading/error states.
- `src/app/api/admin/members/export/route.ts` — CSV download; same `can()` check and wing scoping as the page.
- `tests/` — card-number allocation, review action auth/audit, and submit action validation/duplicate handling.

### Decisions to log

- Public submit has no authenticated actor: audit uses the applicant's email and `actorId: null` (DECISIONS to append).
- `"own"` sentinel in `requireActor` for wing-scoped list reads.
- Native forms instead of React Hook Form for this phase.
- `pdf-lib` added from the existing README stack for the PDF download.

## Verification

`pnpm lint && pnpm typecheck && pnpm test && pnpm build`, then a production smoke at 360px and desktop: apply with valid/invalid data, duplicate rejection, card download, admin approve/revoke/reissue, CSV export, and a WING_LEAD denied a write.
