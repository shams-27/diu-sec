# Full-width Pattern, Wider Margins, Bigger Type & Page Transitions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paint the public background pattern across the viewport, widen side gutters, enlarge the shared type scale, and crossfade public page content on nav clicks with React's native View Transition.

**Architecture:** A full-width flex wrapper in the public layout owns `.pattern-surface`; header, main and footer keep one shared `max-w-6xl` content column with larger responsive gutters. A remounting `template.tsx` wraps page content in React 19.3's `<ViewTransition>` so route navigations form an exit/enter pair, with short CSS keyframes and a reduced-motion opt-out. No new dependency or client JS.

**Tech Stack:** Next.js 16.4.6 App Router, React 19.3 `ViewTransition`, Tailwind 4, Playwright, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-27-full-width-pattern-page-transitions-design.md`

## Global Constraints

- Work on `main`; do not stage or restore the local `D .env.example`.
- No new dependency, no client-side router wrapper, no custom loading overlay.
- Home hero and LCP text stay static; CLS must stay 0.
- `prefers-reduced-motion: reduce` removes all non-essential motion.
- Mobile-first ≥360px, keyboard accessible, WCAG AA; no horizontal overflow.
- Gate per task: `pnpm lint && pnpm typecheck && pnpm test`, plus `pnpm e2e` before the final commit.

## Review Focus

- **360px viewport with larger headings:** text must not overflow the viewport; e2e asserts `document.documentElement.scrollWidth <= innerWidth` on `/` and a page using `.page-title`.
- **Pattern edges:** wrapper must span the viewport, not the `max-w-6xl` column; e2e compares wrapper width to `innerWidth`.
- **Header/main/footer alignment:** all three share the same gutter; e2e compares computed `paddingLeft` at 360px and 1280px.
- **Nav click transition:** clicking a header link must call `document.startViewTransition` and land on the new route; e2e spies on the API and asserts URL.
- **Reduced motion:** view-transition animations must be zeroed; e2e asserts the reduced-motion stylesheet rule applies by checking `animation-duration` on `::view-transition-new(.page-fade)` is `0s` after emulation, or (if pseudo styles are unavailable) asserts the rule text is present in the loaded CSS.

---

### Task 1: Full-width pattern, wider gutters, bigger type

**Files:**
- Modify: `src/app/(public)/layout.tsx:4-19`
- Modify: `src/components/public/site-header.tsx:15-16`
- Modify: `src/components/public/site-footer.tsx:28-29`
- Modify: `src/app/globals.css:208-222`
- Test: `e2e/home.spec.ts:24-40`

**Interfaces:**
- Consumes: `.pattern-surface`, `.display-title`, `.page-title`, `.section-title`, `.lead-text` from `src/app/globals.css`.
- Produces: full-width `.pattern-surface` wrapper around all public content; shared gutter utility string `px-6 sm:px-10 lg:px-16`.

- [ ] **Step 1: Write the failing e2e assertions**

In `e2e/home.spec.ts`, extend the existing pattern test to assert: (a) the pattern host is the full-width wrapper (`locator(".pattern-surface")`, width equals `innerWidth`); (b) `main`, header inner div and footer inner div have equal computed `paddingLeft` at 360px; (c) `.display-title` computed font size is at least 60px at 360px and at least 96px after `page.setViewportSize({ width: 1280, height: 900 })`; (d) `document.documentElement.scrollWidth <= innerWidth` on `/` at both widths.

- [ ] **Step 2: Run the failing test**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep motion`
Expected: FAIL on pattern host width / font size / gutter equality.

- [ ] **Step 3: Implement layout, gutters and type scale**

In `src/app/(public)/layout.tsx`, wrap the skip link, header, `<main>` and footer in `<div className="pattern-surface flex min-h-screen flex-col">`; remove `pattern-surface` from `<main>` and set its column to `mx-auto w-full max-w-6xl px-6 py-10 sm:px-10 lg:px-16`. Apply the same responsive gutter classes to the header inner div (`src/components/public/site-header.tsx:16`) and footer inner div (`src/components/public/site-footer.tsx:29`). In `src/app/globals.css`, bump `.display-title` to `text-6xl sm:text-8xl`, `.page-title` to `text-5xl sm:text-7xl`, `.section-title` to `text-4xl sm:text-5xl`, `.lead-text` to `text-lg sm:text-xl`; leave body text and `.stat-value` unchanged.

- [ ] **Step 4: Run the test to verify it passes**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep motion`
Expected: PASS, including no horizontal overflow at 360px and 1280px.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(public)/layout.tsx' src/components/public/site-header.tsx src/components/public/site-footer.tsx src/app/globals.css e2e/home.spec.ts docs/DECISIONS.md docs/design-system.md
git commit -m "feat(ui): paint full-width pattern, widen gutters and enlarge type"
```

Include a `docs/DECISIONS.md` row recording that "wider margin" means shared `px-6 sm:px-10 lg:px-16` gutters on all three public containers, and update `docs/design-system.md` type-scale and pattern lines to the new values.

---

### Task 2: Native page transition on public nav clicks

**Files:**
- Create: `src/app/(public)/template.tsx`
- Modify: `src/app/globals.css:134-143,225-233`
- Test: `e2e/home.spec.ts:24-40`

**Interfaces:**
- Consumes: React 19.3 `ViewTransition` (`name`, `default`, `share` props).
- Produces: a single named transition participant `public-page` with class `page-fade`, used by CSS.

- [ ] **Step 1: Write the failing e2e test**

Add a test in `e2e/home.spec.ts` that installs an init script wrapping `document.startViewTransition` with a counter, loads `/`, clicks the header `Events` link, awaits `/events`, and asserts the counter is greater than 0 and that an element with computed `view-transition-name: public-page` exists. In the existing reduced-motion test, after `page.emulateMedia({ reducedMotion: "reduce" })`, assert the loaded stylesheet contains a `::view-transition-new(.page-fade)` rule with `animation-duration: 0s` (the rule may be in a `@media (prefers-reduced-motion: reduce)` block).

- [ ] **Step 2: Run the failing test**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep "page transition|reduced-motion"`
Expected: FAIL — counter is 0 and no `view-transition-name` element exists.

- [ ] **Step 3: Add the template and transition CSS**

Create `src/app/(public)/template.tsx` as a server component:

```tsx
import { ViewTransition } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition name="public-page" default="page-fade" share="page-fade">
      <div>{children}</div>
    </ViewTransition>
  );
}
```

The `<div>` is required because the home page returns a fragment; React styles the single host child. In `src/app/globals.css`, add `page-fade-in` and `page-fade-out` keyframes (opacity plus 6px translate on entering content), target `::view-transition-old(.page-fade)` with a 120ms ease-out fade and `::view-transition-new(.page-fade)` with a 200ms ease-in fade-up, add `::view-transition { pointer-events: none; }`, and extend the existing reduced-motion block to zero `animation-duration` and `animation-delay` on `::view-transition-old(*)`, `::view-transition-new(*)` and `::view-transition-group(*)`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep "page transition|reduced-motion"`
Expected: PASS — nav click triggers a view transition and reduced motion zeroes the CSS animation.

- [ ] **Step 5: Full gate and commit**

```bash
set -a; . ./.env; set +a
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e
git add src/app/'(public)'/template.tsx src/app/globals.css e2e/home.spec.ts docs/design-system.md docs/DECISIONS.md
git commit -m "feat(ui): crossfade public pages on navigation"
```

Expected: lint/typecheck clean, 151 unit tests pass, build succeeds, all e2e tests pass.

## Final Verification

- Lighthouse with the project's v13 command (`CHROME_PATH=$(node -e "console.log(require('@playwright/test').chromium.executablePath())") npx --yes lighthouse http://localhost:3003 ...`) must report 100/100/100/100, LCP < 1s, CLS 0.
- Manual browser check at 1440px and 360px: pattern spans full width, gutters align, no overflow, nav crossfade visible, no console errors.
