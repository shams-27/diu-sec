# Decisions Log

Append one entry per assumption or deviation. Newest at the bottom.

| # | Date | Decision | Reason |
|---|------|----------|--------|
| 1 | 2026-11-27 | Student ID regex is `^\d{3}-35-\d{3,4}$` | Spec only says `XXX-35-XXX`; `35` = SWE code. Single constant in `validators.ts`. |
| 2 | 2026-11-27 | Auth.js uses JWT sessions, no Account/Session DB tables | Only Google @diu.edu.bd login; role is looked up from `User` by email at sign-in. Avoids name clash with club `ExecSession`. |
| 3 | 2026-11-27 | Club sessions modeled as `ExecSession` | Avoid clash with auth "Session". |
| 4 | 2026-11-27 | RBAC matrix defined in `src/lib/rbac.ts` | PDFs list roles but not per-module permissions. |
| 5 | 2026-11-27 | Cert ID = `DIU-SEC-CERT-` + 6 random chars (A-Z, 2-9, no ambiguous) | Spec says `XXXX`; random avoids guessable sequences. Validator accepts 4+. |
| 6 | 2026-11-27 | pnpm installed globally as a shell script; used `/tmp/opencode/bin/pnpm` shim for the shadcn CLI | Global pnpm lacks a shebang (`spawn ENOEXEC`); shim is local/untracked, not a repo dependency. |
| 7 | 2026-11-27 | UI/UX Pro Max used from `/home/shams/.opencode/skills/ui-ux-pro-max` | Repo-local `.opencode/skills/` path from AGENTS.md does not exist here; global copy has the same data. |
| 8 | 2026-11-27 | Local `.env` uses `postgresql://postgres@127.0.0.1:5432/diusec` | Local Postgres trusts TCP for `postgres`; `.env` is untracked, production supplies its own URL. |
| 9 | 2026-11-27 | Pinned Prisma 6 and Zod 3; scaffolded with Next 16 + Tailwind 4 | Prisma 7 drops `prisma-client-js`; Zod 4 drops `.cuid()`; pins keep the existing schema/validators valid. |
| 10 | 2026-11-27 | `vitest.config.mts` (not `.ts`) and no `shadcn/tailwind.css` import | Native Vite loader needs `.mjs`/`.mts`; shadcn package import is unresolvable and unused. |
| 11 | 2026-11-27 | Brand palette kept in hex (not OKLCH); footer has no dynamic year | Exact generated brand colors; Next 16 Cache Components rejects `new Date()` at prerender. |
| 12 | 2026-11-27 | Added `next-auth@beta` (v5.0.0-beta.32) for Auth.js | Only v5 supports Next 16 App Router and `proxy.ts`; v4 needs the deprecated middleware convention. |
| 13 | 2026-11-27 | `trustHost: true` in Auth.js config | Auth.js v5 rejects production requests with `UntrustedHost` unless the host is trusted; Vercel auto-detects, but self-hosting/`pnpm start` needs this. Deployment host header must be trusted. |
| 14 | 2026-11-27 | `export const instant = false` on the admin layout | Cache Components cannot prerender per-request auth reads; documented blocking-route opt-out covers every `/admin/*` page. |
| 15 | 2026-11-27 | Default Auth.js sign-in page; audit viewer limited to 100 rows | No custom login UI in README; caps unbounded log growth in the read-only viewer. |
| 16 | 2026-11-27 | Refresh `role`/`wingId` from `User` on every JWT callback | A signed-in admin kept stale privileges for up to 30 days after demotion; Next 16 proxy runs on Node, so Prisma works there. Cost: one DB read per authenticated admin request. |
| 17 | 2026-11-27 | A-12 can clear a role; the last SUPER_ADMIN cannot be demoted; audit "To" is an exclusive next-day bound | Roleless users are the documented way to revoke admin access; one careless demotion otherwise locks everyone out; a midnight `lte` bound hid most of the selected day. |
| 18 | 2026-11-27 | Correction to #14: `instant = false` only disables instant-navigation validation; `await connection()` before `auth()` in the admin layout and each A-12 page is what stops the prerender pass | Auth.js creates a CSRF token with `crypto.getRandomValues` on session reads without a CSRF cookie; Next 16 logged `blocking-prerender-crypto` on every A-12 request. Connecting first defers to request time. Server actions are unchanged. |
| 19 | 2026-11-27 | Public membership submit audits with applicant email and `actorId: null`; member card numbers are allocated by counting existing `SEC-<year>-` rows inside a serializable transaction | No authenticated actor exists on `/join`, but every mutation must still be audited; the DB unique index remains the allocation backstop. |
| 20 | 2026-11-27 | Phase 2 forms use native form + server action + `useActionState` instead of React Hook Form; `pdf-lib` added from the README stack for card PDF download | One short form needs only server-side Zod; adding RHF would duplicate validation. `pdf-lib` is already the specified PDF tool and will be reused in Phase 5. |
| 21 | 2026-11-27 | `requireActor` accepts `"own"` as `resourceWingId` for wing-scoped list reads | A-02 needs wing leads to read only their own wing without a second `auth()` call to discover the wing first. |
| 22 | 2026-11-27 | Revoked/rejected members keep their `memberCardNo`; REISSUE reactivates the same number instead of allocating a new one | Clearing or recycling a number would make an old downloaded card valid again. Status alone controls validity; the card image reads status from the DB on every load. |
| 23 | 2026-11-27 | Seed includes two `PENDING` applicants in different wings | A-02 review and wing-scoped reads must be demoable after `pnpm prisma db seed` without first applying through `/join`. |
