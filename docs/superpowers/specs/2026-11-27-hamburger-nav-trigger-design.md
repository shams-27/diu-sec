# Hamburger Nav Trigger Design

**Status:** Approved

## Intent

The public drawer opens from the left edge, but its `Menu` trigger currently sits in the right-hand header group. Move the trigger to the left edge and show it as a familiar hamburger icon so its position and symbol both point to the drawer.

## Goals

- Header order becomes `[hamburger Menu] [DIU SEC] ——— [Join Now]`.
- The trigger uses the existing `lucide-react` `Menu` icon; no new dependency.
- Keep the accessible name `Menu`, native `<dialog>` behavior, focus ring, and current e2e selectors unchanged.

## Non-goals / anti-goals

- No change to drawer links, footer, or page content.
- No drawer edge handle or second open control.
- No animation, layout rewrite, or new icon asset.

## Constraints

- Mobile-first ≥360px with no horizontal overflow.
- Keyboard accessible with visible focus; WCAG AA.
- Home LCP/CLS budget unchanged.

## Approaches

1. **Hamburger icon at the left edge (chosen).** Familiar affordance, matches the drawer origin, reuses installed `lucide-react`, and keeps one accessible control.
2. Text-only `Menu` at the left edge. Smaller diff, but the word alone is a weaker visual cue than the standard icon.
3. Drawer edge handle. Adds another hit target and needs positioning logic; unnecessary for a header trigger.

## Implementation

- In `src/components/public/site-header.tsx`, render `<SiteNavDrawer />` before the brand link.
- In `src/components/public/site-nav-drawer.tsx`, import `Menu as MenuIcon` from `lucide-react` and render it inside the existing trigger button with `aria-label="Menu"`; keep `aria-haspopup`, `aria-expanded`, `showModal()`, and focus classes.
- Update the drawer e2e test with one assertion that the `Menu` trigger is the first interactive element in the header.
- Update `docs/design-system.md` and `docs/DECISIONS.md` to record the trigger placement and icon.
