# Layered Frontend/Backend Feature Design

**Status:** Proposed

## Intent

The partner wants to add new features quickly. Today a feature's route, UI, action, query, validation and tests sit in separate technical folders (`app/`, `components/`, `lib/`, `server/actions/`, `tests/`), so adding one feature means editing five places. Split the app into two clean layers — frontend and backend — and inside each layer group code by feature.

The partner explicitly chose two layers **inside this one Next.js app**, not two deployable apps. “Convert the whole project to React” is treated as already satisfied: the UI is React 19 / Next.js App Router. No technology swap, no new dependency, no separate API server.

## Goals

- `src/frontend/` holds all UI; `src/backend/` holds all data access, auth, validation, mutations and generation logic.
- One folder per domain exists in each layer, so a new feature means: add a frontend feature folder, a backend feature folder, and a thin route file that points at the frontend page.
- Every existing feature, route, test and behavior keeps working unchanged from the user's point of view.
- Import direction is one-way: frontend may import backend's exported actions/queries/contracts; backend never imports frontend.

## Non-goals / anti-goals

- No separate deployment, no REST API rewrite, no Vite/Express, no React Query, no monorepo tooling.
- No Prisma schema/migration changes, no auth/session changes, no RBAC or audit changes, no UI/styling changes.
- No change to public URLs, component markup, e2e selectors or seeded data.
- No move of `tests/` or `e2e/`; they stay where they are and only their import paths change.

## Constraints

- Next.js 16.4.6 with `cacheComponents: true`, React 19.3.0, Prisma 6, Zod 3, Tailwind 4, Auth.js v5 beta, pnpm 12 — all pinned, none change.
- Next requires route modules under `src/app/`; the directory itself is not moved.
- `@/* → ./src/*` stays as a base alias; add `@/frontend/* → ./src/frontend/*` and `@/backend/* → ./src/backend/*` in `tsconfig.json` and `vitest.config.mts`.
- Most pages export `metadata`. Route files keep their metadata and layout/loading/error/not-found/template files; only the page body moves.
- Unit tests mock exact module IDs (e.g. `@/lib/db`, `@/server/actions/events`); every mocking import path must be updated in the same change.
- E2E pins routes, labels, CSS classes, `/sec_logo.png`, and the Auth.js cookie; none may change.
- Every mutation must still authenticate → authorize via `can()` → Zod-validate → transact → `writeAudit()`; moving files must not drop any of those steps.
- `AuditLog` stays append-only; the DB trigger stays untouched.
- Full gate after the change: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e && git diff --check`.

## Approaches

1. **Two global layers with feature folders inside (chosen).** `src/frontend/features/<domain>/` and `src/backend/features/<domain>/`, each with shared folders for cross-cutting code. Best fit for "add a feature later": one domain folder per layer contains its UI, actions and reads. Costs a wide but mechanical move of ~100 files and import updates.
2. **Layer split only.** `src/frontend/*` and `src/backend/*` grouped by technical type. Cheaper, but finding a feature's pieces stays as hard as today, so it misses the stated goal. Rejected by the partner.
3. **Two deployable apps (React SPA + API).** Rejected by the partner; would require a new server framework, CORS/auth rework, and a deployment rewrite.

## Target Structure

```
src/
  app/                          # routing shell only (unchanged paths)
    (public)/.../page.tsx       # metadata + `export { FeaturePage as default } from "@/frontend/features/<domain>"`
    admin/.../page.tsx          # same
    api/.../route.ts            # metadata-free handlers; delegate to backend features
    layout.tsx, globals.css, robots.ts, sitemap.ts, opengraph-image.tsx
    loading/error/not-found/template files (unchanged)
  frontend/
    shared/
      ui/                       # button.tsx, card.tsx
      shell/                    # site-header, site-footer, site-nav-drawer, admin-sidebar
      form/                     # honeypot-field.tsx
      utils.ts, page-hero.tsx
    features/
      home/                     # public home page body, stat-number
      dashboard/                # admin dashboard body, wing-distribution-chart
      membership/               # public join + ID card + admin members queue
      committee/                # public committee + admin committee + reorder UI
      wings/
      events/                   # public events + registration + admin events + check-in UI
      certificates/             # public verify + admin certificates
      magazine/
      hall-of-fame/
      projects/
      notices/
      resources/
      partners/                 # public partners + admin sponsors
      gallery/                  # public gallery + lightbox + admin gallery
      faq/
      contact/
      access/
      audit/
  backend/
    shared/
      db.ts, auth.ts, rbac.ts, session.ts, admin-guard.ts, audit.ts,
      validators.ts, storage.ts, rate-limit.ts, honeypot.ts, cache-tags.ts
    features/
      membership/               # members.ts, member-review.ts, idcard.ts, export handler
      dashboard/                # dashboard.ts queries
      committee/                # committee.ts
      wings/                    # wings.ts
      events/                   # events.ts
      certificates/             # certificates.ts, certs.ts
      magazine/                 # magazine.ts
      hall-of-fame/             # hall-of-fame.ts
      projects/                 # projects.ts
      notices/                  # notices.ts
      resources/                # resources.ts
      partners/                 # sponsors.ts
      gallery/                  # gallery.ts
      contact/                  # contact.ts
      access/                   # access.ts
      audit/                    # audit viewer query
```

Each backend feature exposes `actions.ts` for mutations and `queries.ts` for reads. Pages that currently call Prisma directly move those calls into the matching `queries.ts` and import the query function instead.

## Layer rules

- Backend files may import Prisma, `next/headers`, Node APIs and other backend modules. Frontend files import backend features only through their exported actions, queries and schema/type contracts.
- `validators.ts` lives in `backend/shared` because it owns the single source of truth for all regexes and Zod schemas; client forms import only its types/schemas. No regex is duplicated.
- `src/proxy.ts` stays at the root because Next expects it there; it re-exports the guard from `backend/shared/auth.ts`.
- `server-only` guards on `backend/shared/db.ts` and `backend/shared/auth.ts` prevent accidental client imports.
- Feature folders may import `backend/shared` but never another feature's internals; cross-feature needs go through that feature's exported functions.

## Migration order (builder's roadmap)

1. Create the two layer trees, add aliases, move `frontend/shared` and `backend/shared`, update all imports, verify gate.
2. Move backend actions/generators and extract page queries into `backend/features/<domain>`, update unit-test mocks, verify gate.
3. Move components and page bodies into `frontend/features/<domain>`, leave thin route files with their metadata, verify gate.
4. Update docs (`README.md`, `AGENTS.md`, `docs/DECISIONS.md`, `docs/design-system.md` paths), delete empty legacy folders, run the full gate and Lighthouse regression.

## What is left to the builder

Decide the exact export names for moved page bodies (e.g. `HomePage`, `MembersPage`) and the file name for each feature's public entry (`index.ts` vs direct path). Keep both choices boring and uniform across all features. Confirm early that Next 16 accepts the thin re-export route pattern by moving one feature first and running `pnpm build` before moving the rest.
