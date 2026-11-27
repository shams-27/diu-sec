# Wider Public Shell Design

**Status:** Approved

## Intent

Public pages look narrow on desktop because the shared shell caps content at `max-w-6xl` (1152px) and then adds `px-16` gutters, leaving roughly 128px empty on each side of a 1280px screen. Widen the shared shell so content uses more of the viewport while keeping readable outer margins.

## Goals

- Change the public shell in `src/app/(public)/layout.tsx` from `max-w-6xl` to `max-w-[1440px]`.
- Keep `px-6 sm:px-10 lg:px-16` gutters unchanged on header, main, and footer.
- Apply to all public pages through the shared layout; no per-page width edits.

## Non-goals / anti-goals

- No full-bleed or edge-to-edge layout; keep a cap for very large monitors.
- No change to gutters, pattern width, page content, or admin UI.
- No new dependency.

## Constraints

- Home hero and LCP stay static; no new animation.
- CLS stays under the existing 0.1 e2e threshold and Lighthouse remains 0.
- Mobile-first ≥360px, no horizontal overflow; header/main/footer gutters stay equal.
- Existing Suspense fallback heights for home highlights must still match rendered content after wider cards wrap less.

## Approaches

1. **Widen cap to `max-w-[1440px]` (chosen).** At 1280px the shell fills the viewport and only the 64px gutters remain; above 1440px content still stops at a readable width. One line, shared by every public page.
2. Remove the cap (`max-w-none`). Fills every screen, but cards and text become too wide on large monitors.
3. Keep `max-w-6xl` and shrink gutters. Small gain; the empty side margins remain.

## Implementation

- Edit `main` in `src/app/(public)/layout.tsx` only; header and footer already use the same `max-w-6xl` and must be changed to `max-w-[1440px]` too so their columns stay aligned with `main`.
- Add an e2e assertion at 1280px that `main` content width (border box minus horizontal padding) is at least 1100px and that header/main/footer gutters remain equal.
- Re-measure the home highlights fallback at 360px, 768px, and 1280px; adjust the existing `min-h-*` values only if the rendered sections shrink enough to shift layout.
- Update `docs/DECISIONS.md` and `docs/design-system.md` with the new shell width and the reason it supersedes the earlier wider-gutter decision without removing those gutters.
