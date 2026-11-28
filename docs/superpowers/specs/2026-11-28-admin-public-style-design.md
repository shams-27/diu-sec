# Admin style alignment — design (superseded by 2026-11-28-admin-brutalist-design.md; decision #86)

## Intent

Make `/admin/*` feel like the same product as the public site. The human partner asked for a minimal, modern admin area and chose **B · Same language, calmer**: public blue tokens, typography, mono eyebrow labels and restrained texture, while keeping dense tables/forms flat and readable. Not the full editorial-brutalist treatment from `.public-brutal` (A), and not a typography-only touch (C).

## Goals

- One visual language across the admin shell and every A-01…A-12 screen: shared tokens, uppercase mono labels, Bebas Neue headings, restrained rules/glows, consistent controls.
- Keep existing information density and all behaviour: RBAC, server actions, audit trails, forms, tables, charts, uploads stay untouched.
- Responsive from 360px, keyboard focus visible, WCAG AA contrast, reduced-motion respected.

## Non-goals / anti-goals

- No changes to public pages; `.public-brutal` stays scoped to public.
- No hard offset shadows, 2px ink rules or square-everything in admin — those made A too heavy for tables.
- No new dependencies, no new route structure, no renaming of features or actions.

## Constraints

- AGENTS.md/README: use semantic tokens, feature-first layers, no new dependency without a decision, log ambiguity in `docs/DECISIONS.md`, update `docs/design-system.md` for UI changes.
- Tailwind utilities are layered; admin rules must be unlayered (like `.public-brutal`) so they can normalise existing page utility classes without editing every page.
- Admin shell is dynamic (`connection()` + `auth()`); styling must not change prerender behaviour.

## Approach (chosen: B)

Wrap the admin shell in one scoped class and add a small unlayered CSS block in `src/app/globals.css`:

- Normalise admin headings to the public type utilities (`.eyebrow`, `.section-title` feel) and labels to Geist Mono uppercase tracking.
- Normalise buttons, selects, inputs and table headers to shared token colours/borders with subtle primary accents; keep tables flat.
- Keep the existing `.admin-banner`, `.dot-grid` and `.hero-surface` patterns but soften them so card/title hierarchy matches public pages without the brutalist shadow.
- Native focus rings and reduced-motion remain intact; no new client components.

Where a page's inline Tailwind cannot be normalised by the scoped CSS, make the smallest targeted markup change in that page.

## Verification

- `pnpm lint && pnpm typecheck && pnpm test`.
- Open `/admin` and at least one form/table page at 360px and desktop with Playwright; check contrast, focus rings, no clipped labels, no behaviour change.
- Record the style choice in `docs/DECISIONS.md` and update `docs/design-system.md` admin section.

## Left to the builder

Exact selector list and which (if any) page-level utility classes to adjust; decided during implementation by reading the admin pages.
