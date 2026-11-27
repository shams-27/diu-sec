# Editorial Brutalism for Public Pages Design

**Status:** Approved

## Intent

Add a “touch of brutalism” to the public website without losing the blue DIU SEC identity. The partner chose the editorial-brutalism direction from three mockups: visible rules, square surfaces, asymmetric blocks, and heavy type, but still navy/blue/white rather than pure primary colours.

## Scope

- Public pages only: the `(public)` route group and shared public shell components.
- Admin panel, auth, and all server behavior are unchanged.

## Goals

- Square corners on public cards, buttons, pills, and dialogs through a scoped public wrapper.
- 2px ink borders and small hard offset shadows replace soft rounded elevation on public surfaces.
- Heavy top rule on the hero, ruled stat grid, stronger mono labels, and visible section rules.
- Keep all text, borders, and shadows derived from existing semantic tokens so light/dark themes keep contrast.

## Non-goals / anti-goals

- No pure red/yellow/blue full-brute palette.
- No removal of motion or accessibility behavior; “touch” means visual structure, not instant transitions.
- No new dependency, no page-content rewrite, no change to admin UI.
- No animation on the home hero or LCP text.

## Constraints

- WCAG AA text contrast and visible focus rings remain unchanged.
- Mobile-first ≥360px with no horizontal overflow.
- Lighthouse accessibility 100, CLS 0, LCP under 1s must be preserved.
- All colours come from CSS variables; no new hard-coded hex in components.

## Approaches

1. **Editorial brutalism (chosen).** Blue identity stays; square surfaces, ink rules, hard shadows, ruled grids, asymmetric hero callout. Fits “a touch” and applies consistently through one public wrapper.
2. Thin brutalist edge. Smaller change: square corners and borders only. Too subtle for the request and less visual hierarchy.
3. Full brute. Pure primary colours and 4px black borders. Strongest look, but conflicts with the established blue palette and admin/public consistency.

## Implementation

- Add a `public-brutal` class to the outer wrapper in `src/app/(public)/layout.tsx`.
- Add a small scoped block in `src/app/globals.css` that, only inside `.public-brutal`:
  - zeroes border radius on public rounded utilities;
  - applies 2px `var(--border)` or `var(--foreground)` borders and 4px `var(--primary)` offset shadows to card/hero surfaces;
  - thickens the hero top border, adds bottom rules to section titles, and bolds/labels mono eyebrows;
  - squares the drawer and its links/buttons without changing native dialog behavior.
- Add e2e assertions that a public hero/card has zero border radius and a hard box shadow, and that an admin card keeps its existing radius.
- Update `docs/design-system.md` and `docs/DECISIONS.md` with the scoped public-only brutalist treatment and the reason admin pages are excluded.
