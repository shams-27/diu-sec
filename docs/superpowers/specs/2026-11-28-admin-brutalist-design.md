# Admin neo-brutalist alignment — design

## Intent

The human partner wants `/admin/*` to follow the same neo-brutalist style chosen for the public site, not the calmer option B currently implemented. Reverses decision #85.

## Goals

- Apply the public brutalist language to every admin screen: square surfaces, 2px ink rules, hard offset shadows, mono labels, blue solid accents.
- Keep dense tables and forms usable: hard shadows on interactive/hover states, not per row; no new dependencies.
- Preserve RBAC, server actions, audit logging, data queries, focus rings and reduced-motion behavior.

## Non-goals

- No public-page changes, no new routes/components, no dependency changes, no behavior changes.

## Approaches

1. **Full brutalist everywhere (chosen)** — reuse the existing `.public-brutal` rules by applying that class to the admin shell alongside `.admin-surface`; keep only the admin-specific mono labels/dot-grid overrides. Most faithful to the chosen style; one e2e assertion about the admin being non-square must be updated.
2. Brutalist shell/cards, ruled tables — rejected: the partner chose full brutalist.

## Constraints

- Tailwind 4 layered utilities vs unlayered `.public-brutal` rules; reuse the existing block rather than duplicating hex values or shadows.
- Mobile ≥360px, keyboard focus visible, WCAG AA, reduced motion unchanged.

## Left to the builder

- Replace the calm `.admin-surface` declarations with the brutalist contract; update `e2e/admin-style.spec.ts` and the admin assertion in `e2e/home.spec.ts`; update `docs/design-system.md` and append a new decision row that reverses #85.
