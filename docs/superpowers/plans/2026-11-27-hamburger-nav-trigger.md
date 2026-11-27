# Hamburger Nav Trigger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the public drawer trigger to the left edge of the header and render it as an accessible hamburger icon.

**Architecture:** `SiteHeader` keeps the same flex shell and moves `<SiteNavDrawer />` before the brand link. `SiteNavDrawer` keeps its native dialog and open/close logic; only the trigger content changes from the text `Menu` to the installed `lucide-react` `Menu` icon, with the accessible name preserved.

**Tech Stack:** Next.js 16 App Router, React 19.3, Tailwind 4, installed `lucide-react`, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-27-hamburger-nav-trigger-design.md`

## Global Constraints

- No new dependency; use the already-installed `lucide-react`.
- Header order is `[hamburger Menu] [DIU SEC] ——— [Join Now]`.
- The trigger keeps accessible name `Menu`, `aria-haspopup="dialog"`, `aria-expanded`, visible focus ring, and `showModal()` behavior.
- Keep shared `px-6 sm:px-10 lg:px-16` gutters and the existing responsive header shell unchanged.
- Mobile-first ≥360px, no horizontal overflow, keyboard accessible, WCAG AA.
- No drawer content, footer, animation, or page-content changes.
- Do not stage or restore the local `D .env.example`.
- Gate: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e`.

## Review Focus

- **360px header order:** the first interactive header control must be the hamburger trigger and the header must not overflow; added to the existing drawer e2e test.
- **Icon-only accessible name:** screen readers and role-based tests must still find `Menu`; the button gets `aria-label="Menu"` and the e2e asserts it.
- **Icon actually renders:** the button must contain an SVG from `lucide-react`; the e2e asserts a visible `svg` inside the trigger.
- **Keyboard/modal behavior:** icon replacement must not break opening, Escape, close, or link navigation; existing drawer e2e assertions still run.
- **No new dependency or layout rewrite:** `package.json` and the header shell classes stay unchanged; verified by the diff and full gate.

---

### Task 1: Left-edge hamburger trigger

**Files:**
- Modify: `src/components/public/site-header.tsx`
- Modify: `src/components/public/site-nav-drawer.tsx`
- Modify: `e2e/home.spec.ts`
- Modify: `docs/design-system.md`
- Modify: `docs/DECISIONS.md`

**Interfaces:**
- Consumes: existing `SiteNavDrawer` export and existing Playwright drawer test.
- Produces: a header trigger with accessible name `Menu`, containing one `svg`, rendered before the brand link; no props or new exports.

- [ ] **Step 1: Add failing e2e assertions**

In the existing `keeps all quick links in an accessible drawer` test in `e2e/home.spec.ts`, immediately after the `Join Now` visibility assertion, add:

```ts
const menuButton = page.getByRole("button", { name: "Menu" });
await expect(page.locator("header a, header button").first()).toHaveAttribute("aria-label", "Menu");
await expect(menuButton.locator("svg")).toBeVisible();
```

- [ ] **Step 2: Run the failing test**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep "keeps all quick links"`

Expected: FAIL because the brand link is currently first and the trigger has no `aria-label` or SVG.

- [ ] **Step 3: Move the trigger and replace its text with the icon**

In `src/components/public/site-header.tsx`, render `<SiteNavDrawer />` as the first child of the inner flex `div`, before the brand `Link`. Keep the outer `<header>`, inner `div`, and `Join Now` link unchanged.

In `src/components/public/site-nav-drawer.tsx`, import `Menu as MenuIcon` from `lucide-react`, add `aria-label="Menu"` to the existing trigger button, and replace its `Menu` text with `<MenuIcon className="size-5" aria-hidden="true" />`. Keep `type`, `aria-haspopup`, `aria-expanded`, `onClick`, and classes unchanged.

- [ ] **Step 4: Update docs**

In `docs/design-system.md`, update the public header guidance to describe the left-edge hamburger trigger. In `docs/DECISIONS.md`, append a row recording the trigger move and icon choice with the reason that it matches the left-side drawer origin and reuses the installed icon library.

- [ ] **Step 5: Run the focused test to verify it passes**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep "keeps all quick links"`

Expected: PASS, including the new first-control, `aria-label`, and SVG assertions.

- [ ] **Step 6: Full gate and commit**

```bash
set -a; . ./.env; set +a
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e
git add src/components/public/site-header.tsx src/components/public/site-nav-drawer.tsx e2e/home.spec.ts docs/design-system.md docs/DECISIONS.md
git commit -m "feat(ui): use a left-edge hamburger menu trigger"
```

Expected: lint/typecheck clean, 151 unit tests, 11 e2e tests, build succeeds.

## Final Verification

- Browser check at 360px and 1280px: hamburger is first in the header, opens the drawer, focus ring is visible, and no horizontal overflow.
- Lighthouse keeps the existing accessibility 100, CLS 0, and LCP under 1s.
