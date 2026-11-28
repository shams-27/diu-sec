# Admin Brutalist Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace the calm admin style layer with the full neo-brutalist public design language.

**Architecture:** Apply the existing unlayered `.public-brutal` rules to the admin shell; keep a small `.admin-surface` block for admin-only mono labels, dot-grid and the banner hard-shadow treatment. Tests assert computed styles in the browser.

**Tech Stack:** Next.js 16, Tailwind CSS 4, Vitest, Playwright. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-28-admin-brutalist-design.md`

## Global Constraints

- No commits or pushes; the human partner handles them.
- No new dependencies; no changes to RBAC, server actions, queries, audit logging or public pages.
- Mobile ≥360px, keyboard focus visible, WCAG AA contrast, reduced motion unchanged.
- Reuse `.public-brutal` and existing tokens; do not add brand hex values or new shadow constants.

## Review Focus

- Admin banner must be square with a 2px ink rule and hard shadow, not calm/rounded — covered by Task 1 home.spec assertion.
- Cards must keep the hard brutalist shadow while focus rings still show — covered by Task 1 card shadow + focus assertions.
- Destructive status pills must stay red despite the mono-pill override — covered by Task 1 destructive-pill assertion.
- Reduced-motion users must keep transition opt-outs — covered by Task 1 reduced-motion test.
- No horizontal overflow at 360px on dashboard or members table — covered by Task 1 viewport loop.

---

### Task 1: Switch the admin surface to brutalist

**Files:**
- Modify: `src/app/admin/layout.tsx:17`
- Modify: `src/app/globals.css:365-425`
- Modify: `e2e/admin-style.spec.ts`
- Modify: `e2e/home.spec.ts:117-122`

**Interfaces:**
- Consumes: `.public-brutal` rules in `src/app/globals.css`; `.admin-surface` from the current layout.
- Produces: admin shell carries both classes; `.admin-surface` contains only mono labels, restrained dot-grid, heading scale and `.admin-banner` hard rule.

- [x] **Step 1: Write failing e2e assertions**

In `e2e/admin-style.spec.ts`, change the admin contract to:
- dashboard section `borderRadius` is `0px`;
- first `[data-slot='card']` `boxShadow` contains `6px 6px`;
- Export CSV link `borderRadius` is `0px`;
keep mono `th`, destructive-pill colour difference, focus ring and reduced-motion assertions unchanged.

In `e2e/home.spec.ts`, change the `/admin` assertion at lines 120-122 from `not.toBe("0px")` to `toBe("0px")` and add `borderTopWidth` `2px` plus `boxShadow` containing `6px 6px` on `main .admin-banner`.

- [x] **Step 2: Run failing tests**

Run: `pnpm e2e e2e/admin-style.spec.ts e2e/home.spec.ts`
Expected: FAIL on radius/shadow assertions; admin still calm.

Ensure port 3003 is free first; if a CSS edit appears not to take effect, run `pnpm build` once to refresh Next's cache.

- [x] **Step 3: Apply the brutalist shell**

Add `public-brutal` to the outer div className in `src/app/admin/layout.tsx` so it reads `admin-surface public-brutal flex …`.

- [x] **Step 4: Replace the calm admin block**

In `src/app/globals.css`, replace the `.admin-surface` block with only:
- heading font/scale rules already present;
- `.admin-surface th` and `.admin-surface .pill` Geist Mono uppercase tracking;
- `.admin-surface .dot-grid` restrained primary dots;
- `.admin-surface .admin-banner` `border: 2px solid var(--foreground)` and `box-shadow: 6px 6px 0 var(--primary)`.

Delete the calm 4px/8px radius rules, the `box-shadow: none` rule, the pill primary colour/border override, and any transition declaration. Let `.public-brutal` supply square corners, 2px ink rules and hard shadows.

- [x] **Step 5: Run tests to green**

Run: `pnpm e2e e2e/admin-style.spec.ts e2e/home.spec.ts`
Expected: PASS.

- [x] **Step 6: Full checks**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: all PASS.

### Task 2: Documentation

**Files:**
- Modify: `docs/design-system.md` (admin section)
- Modify: `docs/DECISIONS.md` (new row after #85)

**Interfaces:** none.

- [x] **Step 1: Update the design-system admin section**

State that every admin screen inherits both `.admin-surface` and `.public-brutal`: square surfaces, 2px ink rules, hard offset shadows, Geist Mono labels, blue banner; tables stay readable via rules, not per-row shadows; focus rings and reduced motion unchanged.

- [x] **Step 2: Append decision #86**

Record that the partner corrected decision #85: admin uses full neo-brutalism, reusing `.public-brutal`; no new dependency or behavior change.

- [x] **Step 3: Full verification**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e`
Expected: all PASS, no commits made.
