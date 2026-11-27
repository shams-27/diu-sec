# Hero Event Banner — Design

## Intent

Replace the hero's static "Next up / 05 wings" callout with a visibly bigger banner for the next published event, including one already in progress. The "Find your wing" grid lower on the page stays.

## Approaches

1. **Enlarge the callout in place, driven by cached event data (chosen).** Keep the asymmetric hero block, grow it, and show the event's type, title, date, seat state and a details link. Below `xl` it sits in flow after the hero buttons; from `xl` it is absolutely positioned to the right of the title. A Suspense fallback reserves its in-flow height so the static `h1` remains LCP and CLS stays flat.
2. **Full-width banner below the hero.** Bigger and simpler, but it stops being the hero callout and loses the editorial asymmetry.
3. **Small callout linking to a banner below.** Redundant; rejected.

## Constraints and non-goals

- Public home page only; `/events` and the wings grid are unchanged.
- Hero `h1` stays static (decision #53). No client JS, no new dependency.
- Reduced motion still disables all movement; no new animation.
- `prefers-reduced-motion`, keyboard access and 360px width still hold.
- Empty state when no event is published: banner says so and links to `/events`.
- Cached data may be a few minutes stale; that is already true of the highlights section and is acceptable for a promotional banner.

## Data

Extend `getHomeHighlights()` in `src/backend/features/home/queries.ts` (already `use cache`, `cacheLife`, tagged) with one `nextEvent`: published, `endsAt >= now`, ordered by `startsAt` ascending, `take: 1`. Ongoing events naturally sort ahead of future ones because their `startsAt` is earlier. Select `id`, `slug`, `title`, `type`, `startsAt`, `endsAt`, `capacity`, `seatsTaken`. Both the hero banner and the existing highlights section call the same cached function, so Next deduplicates the DB read.

## Files to touch

- `src/backend/features/home/queries.ts` — add `nextEvent` to the cached read.
- `src/frontend/features/home/home-page.tsx` — replace the static aside with a data-driven `HeroEventBanner` in its own Suspense boundary; update fallback heights only if the in-flow banner changes the lower section's reserved space.
- `e2e/home.spec.ts` — update the hero-callout test for visibility at 360px, larger width and event content at desktop; add the no-event empty state if cheap to seed.
- `docs/DECISIONS.md` — log the change.

## Builder notes

Use the existing `.brutal-callout`, `.pill` and `card-lift` utilities rather than new styling. Keep the same wrapper classes on the Suspense fallback and the real banner so the mobile position does not jump. Translate dates with `timeZone: "UTC"` as the existing event cards do. An ongoing event is `nextEvent.startsAt <= now`, shown with an "Ongoing" pill; otherwise show the start date and remaining seats.
