# Full-width Pattern & Page Transitions — Short Design

**Date:** 2026-11-27
**Size:** Small change

## Intent

The background texture currently stops at the `max-w-6xl` content column, so the page edges still look plain. The partner also wants navigation between public pages to feel smooth rather than like a hard swap, with wider side margins and larger type.

## Goals

- Paint the token-based pattern across the full viewport width on public pages.
- Add a short, native crossfade when following nav-bar links between public pages.
- Give content wider side margins and increase the shared display/lead type scale one step.
- Keep the home hero static, reduced-motion respected, and Lighthouse/CLS results intact.

## Non-goals

- No new dependency, client-side router wrapper, or custom loading overlay.
- No change to header or footer surfaces; they keep their current opaque backgrounds.
- No admin panel redesign or navigation transition.

## Constraints

- Next.js 16.4.6 App Router, React 19.3, Tailwind 4.
- `pattern-surface` is already a CSS-only gradient utility.
- React `<ViewTransition>` is available; Next docs recommend wrapping pages, not persistent layouts.
- A `template.tsx` remounts on navigation, so it can wrap every public page in one file.
- Home LCP text must remain static; CLS e2e stays green.

## Approaches

1. **Full-width wrapper + `template.tsx` ViewTransition (chosen).** Put `pattern-surface` on a viewport-wide wrapper in `src/app/(public)/layout.tsx`; add `src/app/(public)/template.tsx` that wraps `{children}` in `<ViewTransition name="public-page">`. Add short fade keyframes for that named transition and zero them under reduced motion. No new files beyond the template, no dependency, no JS.
2. **Per-page ViewTransition wrappers.** Follow the docs literally in ~20 `page.tsx` files. Same visual result, much larger diff.
3. **Client-side keyed fade wrapper.** Broader browser support but adds a client component and risks a flash before content appears. Rejected.

## Decided implementation

- `src/app/(public)/layout.tsx`: wrap skip link, header, `main`, and footer in `<div className="pattern-surface min-h-screen">`; remove `pattern-surface` from `<main>` and widen its gutters to `px-6 sm:px-10 lg:px-16` while keeping `max-w-6xl`.
- Bump shared type utilities one step: `.display-title` `text-6xl sm:text-8xl`, `.page-title` `text-5xl sm:text-7xl`, `.section-title` `text-4xl sm:text-5xl`, `.lead-text` `text-lg sm:text-xl`. Body text stays at the current base size to avoid page-wide overflow.
- `src/app/(public)/template.tsx`: new server component exporting a default `Template({ children })` that returns `<ViewTransition name="public-page">{children}</ViewTransition>`.
- `src/app/globals.css`: add short `page-in` / `page-out` opacity-and-tiny-translate keyframes scoped to `::view-transition-old(public-page)` and `::view-transition-new(public-page)`. Keep duration ≤250ms.
- Extend the reduced-motion block to set view-transition animation durations/delays to zero.
- `e2e/home.spec.ts`: assert the page wrapper has `view-transition-name: public-page`, that clicking a header nav link still navigates, and that the full-width wrapper spans the viewport.
- `docs/design-system.md` and `docs/DECISIONS.md`: document the full-width pattern and native navigation transition.

## Left to the builder

- Exact keyframe distance (start with 6px; drop it if it adds CLS or feels like too much movement).
- Whether the transition uses a plain crossfade or a tiny upward drift, judged against the existing `.rise-in` language.

## Verification

- `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e`.
- Playwright check at 1440px and 360px: pattern spans viewport width, nav click changes route, no console errors, no overflow.
- Reduced-motion emulation: view-transition duration is zero and content swaps instantly.
- Lighthouse smoke test with the project's v13 command; target 100/100/100/100, CLS 0.
