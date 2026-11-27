# Phase 1 Design — Auth, RBAC & Audit

Date: 2026-11-27. Status: approved by project rules (AGENTS.md: choose, log, continue).

## Intent

Add Google SSO restricted to `@diu.edu.bd`, carry each user's club role and wing into a JWT session, enforce permissions on the server for `/admin/*`, and ship A-12 (role management + immutable audit viewer). Phase 0 already supplies the Prisma `User`/`AuditLog` models, `rbac.ts`, `audit.ts`, and the DB trigger that blocks audit updates/deletes.

## Goals

- Sign in with Google only; reject other domains and unverified emails.
- Role and `wingId` are refreshed from `User` on every session read (including proxy), so role changes take effect without signing out. No DB row → no role → no admin access.
- `/admin/*` is protected optimistically by `proxy.ts` and actually by `can()`/`assertCan()` in the admin layout, pages, and every server action.
- `/admin/access`: SUPER_ADMIN lists users and changes role/wing through an audited server action.
- `/admin/audit`: SUPER_ADMIN and GENERAL_SECRETARY filter and read logs. No edit/delete path exists.
- Loading, empty, error and not-found states for both new pages; mobile-first and keyboard accessible.

## Non-goals

Password/credentials login, self-service registration, creating new role values, editing audit entries, and any Phase 2+ module UI.

## Constraints

- Auth.js v5 (`next-auth@beta`, v5.0.0-beta.32) — only v5 supports Next 16 App Router and `proxy.ts`; v4 uses the deprecated middleware convention.
- JWT sessions (DECISIONS #2): no adapter, no DB session tables.
- Next 16 names the middleware file `proxy.ts` and exports `proxy`, not `middleware`.
- All regexes stay in `src/lib/validators.ts`; new Zod schemas go there too.
- Every mutation is a server action: authenticate → authorize → Zod-validate → write → `writeAudit()`.
- `.env.example` already declares `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ALLOWED_EMAIL_DOMAIN`.
- Auth.js generates a CSRF token via `crypto.getRandomValues` inside `auth()` when no CSRF cookie is present. Under Cache Components, call `await connection()` before `auth()` in the admin layout and in every admin page that calls `requireActor()`; otherwise the prerender pass logs `blocking-prerender-crypto`. `instant = false` only disables instant-navigation validation — it does not stop prerendering.

## Approaches

1. **Auth.js v5 Google + JWT + proxy + server-side `can()` (chosen).** Matches the documented stack, keeps role checks in one matrix, and avoids DB lookups on every request. The proxy only redirects unauthenticated users; real authorization lives in server code.
2. NextAuth v4 + database adapter. Rejected: v4 uses `middleware.ts`, needs session tables that DECISIONS #2 deliberately removed, and is behind on Next 16.
3. Hand-rolled OAuth. Rejected: security-sensitive, unnecessary, and violates the chosen stack.

## Design

### Files

- `src/auth.ts` — `NextAuth({ providers: [Google], session: { strategy: "jwt" }, callbacks })`.
  - `signIn`: allow only verified `@${DIU_EMAIL_DOMAIN}` emails (constant from `validators.ts`).
  - `jwt`: look up `db.user` by normalized email on every call and copy `id`, `role`, `wingId` to the token. Next 16 proxy uses the Node runtime, so Prisma is available there; one DB read per authenticated admin request.
  - `session`: expose `session.user.id/role/wingId`.
  - `authorized`: for `/admin/:path*` require a session with a role; otherwise deny.
- `src/types/next-auth.d.ts` — module augmentation for the extra session/token fields.
- `src/app/api/auth/[...nextauth]/route.ts` — `export const { GET, POST } = handlers`.
- `src/proxy.ts` — `export { auth as proxy } from "@/auth"` with `config.matcher = ["/admin/:path*"]`.
- `src/lib/session.ts` — `requireActor(module, action, wingId?)`: `await auth()`, map session to `Actor`, `assertCan`, redirect/throw when denied. Used by admin layout, pages, and actions.
- `src/server/actions/access.ts` — `setUserRoleAction`: auth → `can("access","write")` → Zod → `db.user.update` → `writeAudit` → `revalidatePath`.
- `src/app/admin/layout.tsx` — async; requires any role (`redirect("/")` when absent); keeps shell from Phase 0.
- `src/app/admin/access/page.tsx` — SUPER_ADMIN only; user list with role/wing forms.
- `src/app/admin/audit/page.tsx` — read-only filtered table (actor email, action, entity, date range; cap 100 rows).
- `tests/` — cases for domain restriction, role-schema validation, and `can("access"|"audit")` permissions.

### Security rules

- Proxy is a UX shortcut only; a user with no role is also denied by the layout and by each action.
- Audit log is written through `writeAudit()` in the same action that changes a role; the DB trigger makes later edits impossible.
- `writeAudit` uses `actorId` from the authenticated session, never from form input.
- `AUTH_SECRET`, Google credentials stay in `.env` (untracked).

### Verification

`pnpm lint && pnpm typecheck && pnpm test && pnpm build`; browser check `/admin` redirects when signed out, plus a DB check that an audit `UPDATE`/`DELETE` still fails.

## Calls made by the builder (not user decisions)

- Default Auth.js sign-in page at `/api/auth/signin`; no custom login screen in this phase.
- Audit viewer caps at 100 rows with no pagination (YAGNI until the log grows).
- The domain check uses the `DIU_EMAIL_DOMAIN` constant in `validators.ts`; `ALLOWED_EMAIL_DOMAIN` stays in `.env.example` for documentation but is not read, so there is one source of truth.
