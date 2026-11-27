# Impact Cards and Digit Shuffle Design

**Status:** Approved

## Intent

Make the “Our impact” cards look like the rest of the public brutalist cards, give the four headline numbers more presence, and have those digits flicker briefly when a visitor reaches the section.

## Scope

- The four impact cards and `.stat-value` style on the public homepage only.
- No admin, auth, server-action, or data changes. No new dependency.

## Goals

- Impact cards use the same `6px 6px 0 var(--primary)` hard shadow as other `.card-lift` cards, including the `8px` hover state. Their 6px left rule stays.
- Numbers are visibly larger while “1,200+” still fits inside a card at 360px and at the 4-column breakpoint.
- Digits shuffle once when the cards first scroll into view, then settle on the real value.

## Non-goals / anti-goals

- No count-up animation, no sound, no per-card stagger beyond the existing one.
- No animation on the hero or LCP text, no new fonts, no new dependencies.
- No change to the numbers themselves or to admin styling.

## Constraints

- The homepage is statically cached: final numbers must be in the server HTML, and the shuffle starts only after hydration.
- Reduced-motion users see the final value immediately.
- Screen readers read the final value, never the flicker.
- No layout shift (tabular digits, punctuation unchanged) and no horizontal overflow at 360px.
- Lighthouse accessibility 100, CLS 0, and LCP under 1s must be preserved.

## Approaches

1. CSS-only flicker on page load — no JS, but it finishes below the fold on phones and cannot randomize digits. Rejected.
2. Client component shuffling on mount — random digits, but phones miss it. Rejected.
3. **Client component shuffling on first scroll into view (chosen).** `IntersectionObserver` starts one short random digit flicker per number; the partner picked this so the effect is seen on every screen size.

## Implementation

- Remove the `4px` shadow override from `.public-brutal .brutal-stats > div` in `src/app/globals.css`, keeping the 6px left rule.
- Increase `.stat-value` from `text-4xl sm:text-5xl` to a larger responsive scale and tighten impact-card padding at small widths as needed to avoid overflow.
- Add one small client component under `src/components/public/` that renders the value in `sr-only`, an `aria-hidden` visual span with tabular digits, and starts an ~8-tick / ~60ms random-digit shuffle when it enters view; punctuation stays fixed and reduced-motion skips the shuffle.
- Use it for the four `<dd>` values on the homepage.
- Add e2e assertions for shadow parity, larger type, the scroll-triggered shuffle settling on the final value, reduced-motion behavior, and 360px overflow; keep the existing CLS test green.
- Update `docs/design-system.md` and `docs/DECISIONS.md` with the decision and reason.

## What is left to the builder

Exact font sizes and card padding are to be settled by measured 360px/768px/1280px checks; the animation duration is the ~480ms proposed above unless measurement argues otherwise.
