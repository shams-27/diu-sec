# Background Pattern Motion — Design

## Intent

Make the existing public background pattern visibly drift so pages feel alive, without adding JS, new DOM, or layout shift.

## Approaches considered

1. **Animate `background-position` on `.pattern-surface` (chosen).** One keyframe shifts only the two 28px grid layers diagonally by one full tile; the radial glows stay fixed. Seamless loop, no new elements, no CLS. The partner asked for noticeable motion, so use an 8s linear infinite cycle (~3.5px/s) rather than a barely-visible drift.
2. **Pseudo-element with `transform: translate3d`.** GPU-composited, but needs stacking/pointer-events handling and more CSS for no visible benefit on a low-contrast pattern.
3. **Scroll-linked drift.** Needs JS and risks jank; rejected for a decorative background.

## Constraints and non-goals

- Public-only: the utility is applied to the public layout wrapper, so `/admin` is untouched.
- The home hero stays static to protect LCP (decision #53).
- `prefers-reduced-motion: reduce` must stop the animation completely.
- No new dependencies, no client components, no change to gradient colors or grid size.

## Files to touch

- `src/app/globals.css` — add `@keyframes pattern-drift`, apply it to `.pattern-surface`, and add a reduced-motion override.
- `e2e/home.spec.ts` — assert the pattern animates at ~8s and stops under reduced motion.
- `docs/DECISIONS.md` — log the chosen motion and speed.

## Builder notes

Keep the animation on the grid layers only by animating all four `background-position` layers together: `0 0, 0 0, 28px 28px, 28px 28px`. Because the grid repeats every 28px, the loop is seamless. If Lighthouse regresses, revisit approach 2; do not remove reduced-motion handling.
