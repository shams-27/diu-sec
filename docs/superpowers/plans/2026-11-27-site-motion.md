# Site Motion & Patterns — Implementation Plan

Date: 2026-11-27
Spec: `docs/superpowers/specs/2026-11-27-site-motion-design.md`

## Context

The public site has a blue palette and a few `rise-in` / `card-lift` utilities, but most pages still read as flat. The human partner asked for animations, motion and background patterns. The home hero must stay static (decision #53: animating it cost ~1.9s LCP), and the measured CLS / Lighthouse gates must stay green. Use CSS only: no new dependency, no client JS.

## Files to touch

- `src/app/globals.css` — three new component utilities + reduced-motion guard.
- `src/app/(public)/layout.tsx` — apply the page-wide pattern to `<main>`.
- `src/components/public/site-header.tsx`, `src/components/public/site-footer.tsx` — shared link underline.
- Public list pages with card grids: `committee`, `wings`, `wings/[slug]`, `events`, `magazine`, `hall-of-fame`, `projects`, `notices`, `resources`, `partners`, `gallery`, `faq`, `page.tsx` (home impact/manifesto/highlights). Add `stagger-in` to the top-level grid container only; never to nested `grid size-16` avatar helpers.
- `e2e/home.spec.ts` — proof of stagger, pattern and reduced-motion opt-out.
- `docs/design-system.md`, `docs/DECISIONS.md` — document the utilities and decision.

## Task 1 — CSS utilities (TDD: assertion first)

1. Add a failing assertion to `e2e/home.spec.ts` that checks:
   - the impact grid's first card has `animation-name: rise-in` and a non-zero `animation-delay` on a later card;
   - `main` has a `background-image` containing both `radial-gradient` and `linear-gradient`;
   - with `reducedMotion: "reduce"`, the same card's `animation-name` is `none`.
2. Run `pnpm e2e --grep "motion"` and confirm it fails.
3. In `src/app/globals.css`:
   - Keep `.rise-in` unchanged.
   - Add `.stagger-in` with direct children using `animation: rise-in 350ms ease-out backwards` and `animation-delay` 0/60/120/180/240/300/360/420ms for `:nth-child(1..8)`, with `nth-child(n+9)` capped at 420ms.
   - Add `.link-underline` using a transform-scaled `::after` bar and a 200ms transition on hover/focus-visible.
   - Add `.pattern-surface` using only low-contrast CSS gradients from `--primary`, `--secondary` and `--border` (no `background-color`, so card/canvas contrast is unchanged).
   - Extend the existing reduced-motion block to disable `.stagger-in > *` animation and `.link-underline::after` transition. Patterns stay static.
4. Run the new e2e assertion and make it pass.

## Task 2 — Apply utilities to public pages

1. `src/app/(public)/layout.tsx`: add `pattern-surface` to the `<main>` class list.
2. `site-header.tsx` and `site-footer.tsx`: add `link-underline` to the shared link class strings; do not change the CTA button or focus rings.
3. Add `stagger-in` to the top-level repeated-content containers listed in "Files to touch". On the home page replace the two `rise-in` + inline `animationDelay` containers with `stagger-in`; do not touch the hero section or the Suspense fallback heights.
4. Ensure no nested avatar/placeholder `grid` helpers receive the class.

## Task 3 — Docs and verification

1. Add a `DECISIONS.md` entry: CSS-only motion/pattern utilities, pattern on the public main surface, hero still static.
2. Update `docs/design-system.md`: document `.stagger-in`, `.link-underline`, `.pattern-surface` and the reduced-motion rule.
3. Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e`.
4. Browser-check `/`, `/committee` and `/events` at 1440px and 360px, plus reduced-motion emulation; assert no overflow, no console errors and readable text over patterns.
5. Run `/ponytail-review` and `verification-before-completion` before committing. Commit as `feat(ui): add subtle site motion and background patterns`.
