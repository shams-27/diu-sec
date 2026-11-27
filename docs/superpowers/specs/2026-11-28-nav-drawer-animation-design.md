# Quick-Links Drawer Animation

**Status:** awaiting approval

## Intent

The public quick-links side panel opens instantly today. Give it a short, polished entrance and exit so the panel feels connected to the header button, without adding client-side state or dependencies.

## Goals

- Slide the drawer in from the left and back out on close.
- Fade the backdrop in and out with the drawer.
- Keep native `<dialog>` semantics: focus trap, Escape, backdrop click and link-click dismissal all unchanged.
- Disable motion for `prefers-reduced-motion: reduce`.
- Match the design system's 200–350ms motion range.

## Non-goals / anti-goals

- No JS close-state machine, timers or new component state.
- No change to the hero event banner or other panels.
- No change to the drawer's size, position, link list or keyboard order.
- No animation on the home hero or LCP text.

## Constraints

- Existing UI is a native `<dialog className="nav-drawer ...">` in `src/frontend/shared/shell/site-nav-drawer.tsx`.
- Shared CSS lives in `src/app/globals.css`; reduced-motion rules are already grouped there.
- Design system (`docs/design-system.md`) specifies 200–350ms transitions and a reduced-motion opt-out.
- E2E already asserts open, close, Escape, backdrop and link navigation in `e2e/home.spec.ts`.

## Approaches

1. **CSS-only discrete transitions (chosen).** Animate `transform` on `.nav-drawer` and `background-color` on its `::backdrop`, with `display`/`overlay` set to `allow-discrete` so the exit plays, and `@starting-style` so the entry plays. Smallest diff; no client code; supported by current Chromium, Safari and Firefox.
2. **JS close-state machine.** Keep the dialog open until an exit animation finishes. More control, but adds timers and can break focus/backdrop behaviour. Rejected.

## Design

- Add a `220ms ease-out` slide (`translateX(-100%)` → `0`) and backdrop fade (transparent → `rgb(0 0 0 / 0.45)`).
- Use `@starting-style` for the closed-to-open state and `transition-behavior: allow-discrete` for `display`/`overlay` on close.
- Extend the existing reduced-motion block so `.nav-drawer` and `.nav-drawer::backdrop` have `transition: none`.
- Add e2e assertions that the drawer is transformed while opening and settled at identity when open, plus a reduced-motion check that transitions are disabled.
- Append one `docs/DECISIONS.md` row and note the drawer motion in `docs/design-system.md`.

## What's left to the builder

- Exact CSS placement and timing tuning within 200–350ms.
- Which e2e test holds the new assertions (existing drawer test or a new focused test).
