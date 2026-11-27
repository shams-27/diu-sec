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
