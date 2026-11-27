# Site Motion & Patterns — Short Design

**Date:** 2026-11-27
**Size:** Small change

## Intent

Make the public website feel deliberately designed after the blue palette and typography refresh. It currently reads as flat: add subtle motion and low-contrast background patterns so pages feel energetic without becoming busy or slower.

## Goals

- Subtle, visible motion on public pages: staggered fade-up for repeated content, gentle hover lift on cards, and a small underline grow on navigation/footer links.
- Add token-based CSS background patterns to break up flat section and card surfaces, reusing the existing dot-grid and radial-glow language.
- Reuse existing CSS utilities and tokens; add no dependency and no client-side animation JS.
- Preserve `prefers-reduced-motion: reduce`, keyboard focus visibility, Lighthouse 100/100/100/100 and e2e CLS = 0.

## Non-goals

- No page transitions, infinite/autoplay loops, parallax, cursor effects or scroll-linked timelines.
- No Framer Motion / GSAP / new bundle cost.
- No downloaded texture images, SVG noise files or new media assets.
- No admin-module redesign; admin inherits shared utilities only.

## Anti-goals

- Animating the home hero or LCP text (decision #53: that cost ~1.9s LCP).
- Layout-shifting or delayed content that reintroduces CLS.
- High-contrast patterns that compete with text or reduce readability.
- Motion that cannot be disabled by the user.

## Constraints

- Next.js 16 App Router, Tailwind 4 `@layer components`, existing `rise-in` / `card-lift` utilities.
- Home hero stays static; home highlight fallback heights are tuned for CLS.
- Playwright asserts homepage CLS; Lighthouse gate targets 100/100/100/100.
- Decisions #45, #46, #53 already constrain caching and hero motion.

## Approaches

1. **CSS-only shared utilities (chosen).** Extend `globals.css` with `.stagger-in` (direct children reuse `rise-in` with nth-child delays), `.link-underline` (transform-based underline on hover/focus) and `.pattern-surface` (static layered gradients: faint grid lines plus a primary-tinted radial glow). Reuse `.dot-grid` and `.hero-surface` on public sections. Zero bundle cost, SSR/static output stays intact, reduced-motion handled in one place.
2. **JS animation library.** More elaborate reveals/transitions, but adds a dependency, client JS, CLS/LCP risk and more reduced-motion code. Rejected for this change.
3. **Native CSS `view()` scroll timelines / image textures.** Scroll timelines have uneven support and need static fallbacks; image assets add weight and new media. Rejected.

## Decided implementation

- `src/app/globals.css`: keep `.rise-in`; add `.stagger-in` using `animation: rise-in 350ms ease-out backwards` on direct children with delays up to 8 steps; add `.link-underline` with a `scaleX` pseudo-element transition (200ms); add `.pattern-surface` with low-contrast CSS gradients derived from `--primary`, `--secondary` and `--border`. Disable motion utilities under the existing reduced-motion block; patterns remain static.
- Public pages: apply `.stagger-in` to repeated card grids (committee, wings, events, magazine, hall-of-fame, projects, resources, partners, gallery, notices, FAQ and the home metric/manifesto blocks). Apply `.card-lift` to cards that do not already have it. Apply `.link-underline` to site-header and site-footer links.
- Patterns: apply `.pattern-surface` to alternating public section bands and card containers, and reuse `.dot-grid` / `.hero-surface` where a section already has a branded surface. Decorative pattern layers stay behind content and never add layout height.
- Keep `PageHero` and the home hero behaviour unchanged except for any stagger already present.
- Update `docs/design-system.md` motion/pattern rules and add a `DECISIONS.md` entry.

## Left to the builder

- Final page-by-page list of grid containers and section bands, based on the actual markup.
- Exact nth-child delay cap (start at 8 steps; add more only if a visible grid needs it).

## Verification

- `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- `pnpm e2e` (includes homepage CLS regression)
- Playwright check at 1440px and 360px plus reduced-motion emulation; assert no overflow or page errors, and that patterns do not reduce text contrast.
- Lighthouse performance/accessibility/best-practices/SEO smoke test.
