# AGENTS.md — DIU SEC Website & Admin Panel

Read `README.md` fully before coding. It is the source of truth. Requirements are in `docs/requirements/website.md` and `docs/requirements/admin-panel.md` (they win over README on conflicts). Never read PDFs in `docs/archive/`.

## Workflow
- Work one phase at a time following README Section 10 (Build Order). Tick the checkboxes in README as you finish items.
- After each phase run `pnpm lint && pnpm typecheck && pnpm test`. Fix failures. Then commit: `feat(phase-N): <summary>`.
- Ambiguity: choose the simplest option, log it in `docs/DECISIONS.md`, continue. Ask only before destructive actions.

## Stack (do not change without logging in DECISIONS.md)
Next.js App Router + TypeScript strict, Tailwind + shadcn/ui, PostgreSQL + Prisma, Auth.js (Google, JWT sessions, `@diu.edu.bd` only), Zod, React Hook Form, pdf-lib, qrcode, html5-qrcode, Recharts, Vitest, Playwright, pnpm.

## Required plugins & skills (already configured in `opencode.json` / `.opencode/skills/`)
Restart OpenCode after cloning so plugins install. Verify: ask "Tell me about your superpowers" and run `/ponytail`.

| Tool | Use it for |
|---|---|
| **superpowers** (plugin) | Process. Before each phase: `brainstorming` → `writing-plans`. While building: `test-driven-development`, `systematic-debugging`. Before commit/finish: `verification-before-completion`, `requesting-code-review`. Load via the `skill` tool. |
| **ponytail** (plugin) | Keeps code minimal (YAGNI, reuse before writing). Never trade away validation, auth, RBAC, audit, security or accessibility. Run `/ponytail-review` before each phase commit and `/ponytail-audit` after Phases 5, 8 and 9. |
| **ui-ux-pro-max** (skill, `.opencode/skills/ui-ux-pro-max`) | MANDATORY before building any UI: generate a design system first (`python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "<product keywords>" --design-system -p "DIU SEC"`), save it to `docs/design-system.md`, and follow it on every page. Use `--stack nextjs` / `shadcn` for stack guidance. |
| **design-system, ui-styling, brand** (skills) | Tokens, Tailwind/shadcn styling, consistent branding. Read the matching SKILL.md before styling work. |
| **context7** (MCP) | Fetch current docs for Next.js, Prisma, Auth.js, Tailwind, shadcn, Zod. Add "use context7" when an API is uncertain. Do not guess APIs. |
| **playwright** (MCP) | Open the running app, check pages at 360px and desktop, and verify flows before marking a phase done. |

Precedence when they conflict: this file and README > superpowers process > ponytail minimalism > UI/UX Pro Max style suggestions. Ponytail never removes anything required by README module tables.

## Hard rules
1. **Validators live only in `src/backend/shared/validators.ts`** (student ID `XXX-35-XXX`, `@diu.edu.bd` email, cert ID `DIU-SEC-CERT-XXXX`, GitHub URL). Never duplicate regexes.
2. **Every mutation** is a server action in `src/backend/features/<domain>/*` that does, in order: authenticate → authorize (`can()` from `src/backend/shared/rbac.ts`) → Zod-validate → write (in a transaction when multi-step) → `writeAudit()`.
3. **Permissions are enforced server-side.** Hiding UI is never enough. Wing Leads are limited to their own wing's data.
4. **AuditLog is append-only.** No update/delete code paths, ever.
5. **Seat counts** change only inside a DB transaction (no overbooking).
6. No secrets in git. New env vars go in `.env.example`.
7. When fixing a bug, fix the whole class (e.g., missing auth check → audit all actions).
8. Every page/route group has loading, empty, and error states. Mobile-first (≥360px), keyboard accessible.
9. Do not add features outside README. Do not add major dependencies without logging why.
10. Keep commit messages and replies concise.
11. **Feature-first layers:** UI in `src/frontend/features/<domain>/`, data and mutations in `src/backend/features/<domain>/`; route `page.tsx` files hold only metadata plus a re-export. Frontend never imports Prisma; backend never imports frontend.

## Definition of done
Matches README module table · Zod-validated · RBAC-checked · audited · loading/empty/error states · responsive · lint+typecheck+tests pass · seed data allows a demo.

## Useful commands
`pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm e2e` · `pnpm prisma migrate dev` · `pnpm prisma db seed`

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
